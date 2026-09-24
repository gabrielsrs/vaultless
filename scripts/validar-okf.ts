#!/usr/bin/env bun
/**
 * Validador do bundle OKF deste repositório.
 *
 * A tooling de agentes em .agents/ é dependência vendada e fica fora do
 * bundle (SKILL.md de terceiros não usa `type`, e node_modules das skills
 * poluiria o resultado). Por isso cada pacote de conteúdo é validado
 * individualmente e os arquivos da raiz seguem as mesmas regras à mão.
 *
 * Uso: bun run scripts/validar-okf.ts
 */
import {
	parseFrontmatter,
	validateBundle,
} from "../.agents/skills/okf/scripts/validate.ts";

const PACOTES = ["track", "prototipos"];
const RAIZ = ["README.md", "index.md", "log.md"];

let erroTotal = 0;
let avisoTotal = 0;

for (const pacote of PACOTES) {
	const resumo = await validateBundle(pacote);
	erroTotal += resumo.totalErrors;
	avisoTotal += resumo.totalWarnings;
	console.log(`\n▶ ${pacote}/ — ${resumo.totalFiles} arquivos verificados`);
	for (const r of resumo.results) {
		console.log(`  📄 ${r.file}`);
		for (const e of r.errors) console.log(`     ❌ ${e}`);
		for (const w of r.warnings) console.log(`     ⚠️  ${w}`);
	}
}

console.log("\n▶ raiz — arquivos de navegação do bundle");
for (const nome of RAIZ) {
	const arquivo = Bun.file(nome);
	if (!(await arquivo.exists())) {
		console.log(`  ❌ ${nome} não encontrado`);
		erroTotal++;
		continue;
	}
	const conteudo = await arquivo.text();
	if (nome === "index.md" || nome === "log.md") {
		if (conteudo.startsWith("---")) {
			console.log(`  ⚠️  ${nome} é arquivo reservado; não deveria ter frontmatter`);
			avisoTotal++;
		} else {
			console.log(`  ✅ ${nome}`);
		}
	} else {
		const { error, parsed } = parseFrontmatter(conteudo);
		if (
			error ||
			!parsed ||
			typeof parsed.type !== "string" ||
			parsed.type.trim().length === 0
		) {
			console.log(`  ❌ ${nome}: ${error ?? "frontmatter sem campo 'type'"}`);
			erroTotal++;
		} else {
			console.log(`  ✅ ${nome} (type: ${parsed.type})`);
		}
	}
}

console.log(`\n${"─".repeat(52)}`);
if (erroTotal === 0) {
	console.log(`✅ Bundle OKF conforme. Avisos: ${avisoTotal}`);
} else {
	console.log(`❌ Bundle NÃO conforme: ${erroTotal} erros, ${avisoTotal} avisos.`);
	process.exit(1);
}
