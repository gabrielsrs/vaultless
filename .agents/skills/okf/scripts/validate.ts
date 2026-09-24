#!/usr/bin/env bun
/**
 * Validador de Conformidade OKF (Open Knowledge Format)
 * Construído com APIs nativas do Bun (Bun.file, Bun.Glob, Bun.YAML)
 *
 * Execução CLI:
 *   bun run validate.ts <caminho-do-bundle>
 */

import { join, resolve } from "node:path";

export interface ValidationResult {
	file: string;
	errors: string[];
	warnings: string[];
}

export interface ValidationSummary {
	conformant: boolean;
	totalFiles: number;
	totalErrors: number;
	totalWarnings: number;
	durationMs: number;
	results: ValidationResult[];
}

export function parseFrontmatter(content: string): {
	frontmatterRaw: string | null;
	body: string;
	parsed: Record<string, unknown> | null;
	error?: string;
} {
	if (!content.startsWith("---")) {
		return {
			frontmatterRaw: null,
			body: content,
			parsed: null,
			error: "Arquivo não inicia com delimitador '---'.",
		};
	}

	const lines = content.split(/\r?\n/);
	let closingIndex = -1;

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		if (line !== undefined && line.trim() === "---") {
			closingIndex = i;
			break;
		}
	}

	if (closingIndex === -1) {
		return {
			frontmatterRaw: null,
			body: content,
			parsed: null,
			error: "Delimitador de fechamento '---' ausente.",
		};
	}

	const frontmatterRaw = lines.slice(1, closingIndex).join("\n");
	const body = lines.slice(closingIndex + 1).join("\n");

	try {
		const parsed =
			(Bun.YAML.parse(frontmatterRaw) as Record<string, unknown>) || {};
		return { frontmatterRaw, body, parsed };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			frontmatterRaw,
			body,
			parsed: null,
			error: `Erro ao processar YAML: ${message}`,
		};
	}
}

function removeCodeBlocks(markdown: string): string {
	return markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

export async function validateBundle(
	bundlePath: string,
): Promise<ValidationSummary> {
	const startTime = performance.now();
	const absoluteRoot = resolve(bundlePath);

	// Escaneamento de todos os arquivos markdown com Bun.Glob
	const glob = new Bun.Glob("**/*.md");
	const markdownFiles: string[] = [];

	for await (const file of glob.scan({ cwd: absoluteRoot })) {
		if (!file.startsWith(".git") && !file.startsWith("node_modules")) {
			markdownFiles.push(file.replaceAll("\\", "/"));
		}
	}

	const results: ValidationResult[] = [];
	let totalErrors = 0;
	let totalWarnings = 0;

	for (const relPath of markdownFiles) {
		const fullPath = join(absoluteRoot, relPath);
		const fileName = relPath.split("/").pop() || "";
		const isInsideReferences =
			relPath.startsWith("references/") || relPath.includes("/references/");

		// Conforme §6 da Spec OKF, referências não-concept são isentas de frontmatter
		if (isInsideReferences) {
			continue;
		}

		const fileHandle = Bun.file(fullPath);
		const content = await fileHandle.text();
		const res: ValidationResult = { file: relPath, errors: [], warnings: [] };

		const isReserved = fileName === "index.md" || fileName === "log.md";

		if (isReserved) {
			if (fileName === "index.md" && content.startsWith("---")) {
				const { parsed } = parseFrontmatter(content);
				if (parsed && !parsed.okf_version && !parsed.title) {
					res.warnings.push("index.md contém frontmatter não convencional.");
				}
			}
			if (fileName === "log.md" && content.startsWith("---")) {
				res.warnings.push("log.md não deve conter frontmatter.");
			}
		} else {
			// Regra 1: Frontmatter presente e parseável
			const { frontmatterRaw, parsed, error } = parseFrontmatter(content);

			if (error || !frontmatterRaw) {
				res.errors.push(
					`Regra 1 violada: ${error || "Frontmatter YAML ausente"}`,
				);
			} else if (parsed) {
				// Regra 2: Campo type obrigatório e não vazio
				if (
					!parsed.type ||
					typeof parsed.type !== "string" ||
					parsed.type.trim().length === 0
				) {
					res.errors.push(
						"Regra 2 violada: Campo 'type' ausente ou vazio no frontmatter.",
					);
				}

				// Avisos de metadados recomendados
				if (!parsed.title) {
					res.warnings.push("Campo recomendado 'title' ausente.");
				}
				if (!parsed.description) {
					res.warnings.push("Campo recomendado 'description' ausente.");
				}
				if (parsed.status === "deprecated") {
					res.warnings.push("Concept com status 'deprecated'.");
				}
				if (parsed.stale_after && typeof parsed.stale_after === "string") {
					const staleDate = new Date(parsed.stale_after);
					if (
						!Number.isNaN(staleDate.getTime()) &&
						staleDate.getTime() < Date.now()
					) {
						res.warnings.push(
							`Data stale_after expirada (${parsed.stale_after}). Concept requer revisão.`,
						);
					}
				}
			}
		}

		// Checagem assíncrona de links internos com Bun.file().exists()
		const proseWithoutCode = removeCodeBlocks(content);
		const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

		for (const match of proseWithoutCode.matchAll(linkRegex)) {
			const targetLink = match[2];
			if (!targetLink) {
				continue;
			}

			if (
				!targetLink.startsWith("http://") &&
				!targetLink.startsWith("https://")
			) {
				let targetAbsPath: string;
				if (targetLink.startsWith("/")) {
					targetAbsPath = join(absoluteRoot, targetLink.slice(1));
				} else {
					targetAbsPath = resolve(fullPath, "..", targetLink);
				}

				const targetFile = Bun.file(targetAbsPath);
				const linkExists = await targetFile.exists();
				if (!linkExists) {
					res.warnings.push(`Link interno não encontrado: '${targetLink}'`);
				}
			}
		}

		if (res.errors.length > 0 || res.warnings.length > 0) {
			results.push(res);
			totalErrors += res.errors.length;
			totalWarnings += res.warnings.length;
		}
	}

	const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
	const conformant = totalErrors === 0;

	return {
		conformant,
		totalFiles: markdownFiles.length,
		totalErrors,
		totalWarnings,
		durationMs,
		results,
	};
}

// Execução via linha de comando
if (import.meta.main) {
	const targetPath = Bun.argv[2] || ".";
	console.log(`\nValidando bundle OKF em: ${resolve(targetPath)}`);

	const summary = await validateBundle(targetPath);

	console.log(`Arquivos markdown analisados: ${summary.totalFiles}\n`);

	for (const r of summary.results) {
		console.log(`📄 ${r.file}`);
		for (const err of r.errors) {
			console.log(`   ❌ [ERRO] ${err}`);
		}
		for (const warn of r.warnings) {
			console.log(`   ⚠️  [AVISO] ${warn}`);
		}
		console.log("");
	}

	console.log("--------------------------------------------------");
	if (summary.conformant) {
		console.log(
			`✅ Bundle CONFORMANTE com a especificação OKF (concluído em ${summary.durationMs}ms).`,
		);
		if (summary.totalWarnings > 0) {
			console.log(`Avisos informativos: ${summary.totalWarnings}`);
		}
		process.exit(0);
	} else {
		console.log(
			`❌ Bundle NÃO CONFORMANTE (${summary.totalErrors} erros, ${summary.totalWarnings} avisos em ${summary.durationMs}ms).`,
		);
		process.exit(1);
	}
}
