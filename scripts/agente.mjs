import { GoogleGenAI, Type } from '@google/genai';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'Sua_Chave_Aqui') {
    console.error('Defina GEMINI_API_KEY no arquivo .env da raiz do projeto.');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const workspaceRoot = process.cwd();
const MAX_STEPS = 8;

function resolveSafePath(relativePath) {
    if (!relativePath || typeof relativePath !== 'string') {
        throw new Error('relativePath deve ser uma string.');
    }

    const fullPath = path.resolve(workspaceRoot, relativePath);
    const normalizedRoot = path.resolve(workspaceRoot);
    if (!fullPath.startsWith(normalizedRoot)) {
        throw new Error('Acesso negado: caminho fora da raiz do projeto.');
    }
    return fullPath;
}

async function createOrUpdateFile({ relativePath, content }) {
    const fullPath = resolveSafePath(relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, String(content ?? ''), 'utf8');
    return { ok: true, action: 'create_or_update', relativePath };
}

async function appendToFile({ relativePath, content }) {
    const fullPath = resolveSafePath(relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.appendFile(fullPath, String(content ?? ''), 'utf8');
    return { ok: true, action: 'append', relativePath };
}

async function readProjectFile({ relativePath }) {
    const fullPath = resolveSafePath(relativePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return { ok: true, relativePath, content };
}

async function listProjectFiles({ relativeDir = '.', recursive = true }) {
    const baseDir = resolveSafePath(relativeDir);

    async function walk(currentDir, acc = []) {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const absolute = path.join(currentDir, entry.name);
            const relative = path.relative(workspaceRoot, absolute).replaceAll('\\', '/');
            if (entry.isDirectory()) {
                if (recursive) {
                    await walk(absolute, acc);
                }
            } else {
                acc.push(relative);
            }
        }
        return acc;
    }

    const files = await walk(baseDir);
    return { ok: true, files };
}

const availableFunctions = {
    create_or_update_file: createOrUpdateFile,
    append_to_file: appendToFile,
    read_project_file: readProjectFile,
    list_project_files: listProjectFiles,
};

const functionDeclarations = [
    {
        name: 'create_or_update_file',
        description: 'Cria ou sobrescreve um arquivo dentro da raiz do projeto.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                relativePath: { type: Type.STRING, description: 'Caminho relativo ao projeto. Ex: src/config/app.json' },
                content: { type: Type.STRING, description: 'Conteudo completo que sera escrito no arquivo.' },
            },
            required: ['relativePath', 'content'],
        },
    },
    {
        name: 'append_to_file',
        description: 'Adiciona conteudo ao final de um arquivo dentro da raiz do projeto.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                relativePath: { type: Type.STRING, description: 'Caminho relativo ao projeto.' },
                content: { type: Type.STRING, description: 'Texto a adicionar no fim do arquivo.' },
            },
            required: ['relativePath', 'content'],
        },
    },
    {
        name: 'read_project_file',
        description: 'Le o conteudo de um arquivo dentro da raiz do projeto.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                relativePath: { type: Type.STRING, description: 'Caminho relativo do arquivo que sera lido.' },
            },
            required: ['relativePath'],
        },
    },
    {
        name: 'list_project_files',
        description: 'Lista arquivos do projeto a partir de uma pasta relativa.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                relativeDir: { type: Type.STRING, description: 'Pasta relativa inicial. Padrao: .' },
                recursive: { type: Type.BOOLEAN, description: 'Se true, inclui subpastas.' },
            },
        },
    },
];

async function runAgent(userPrompt) {
    const contents = [{ role: 'user', parts: [{ text: userPrompt }] }];

    for (let step = 1; step <= MAX_STEPS; step += 1) {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
                systemInstruction:
                    'Você é a Central de Execução da AndMicrocell. SUA REGRA Nº 1: NUNCA explique como programar, NUNCA dê tutoriais e NUNCA dê respostas teóricas. Sempre que o usuário pedir para criar, alterar, configurar robôs, sites ou sistemas, CHAME A FUNÇÃO (tool) imediatamente sem dar explicações longas. Se existir uma ferramenta para a ação, execute-a. Não seja um consultor, seja um executor.',
                tools: [{ functionDeclarations }],
                toolConfig: {
                    functionCallingConfig: {
                        mode: 'AUTO',
                    },
                },
            },
        });

        const functionCalls = response.functionCalls ?? [];
        if (functionCalls.length === 0) {
            const finalText = response.text ?? 'Sem resposta textual.';
            console.log(`\n[Gemini]: ${finalText}`);
            return;
        }

        contents.push({
            role: 'model',
            parts: functionCalls.map((call) => ({ functionCall: call })),
        });

        for (const call of functionCalls) {
            const fn = availableFunctions[call.name];
            if (!fn) {
                contents.push({
                    role: 'user',
                    parts: [{ functionResponse: { name: call.name, response: { ok: false, error: 'Funcao nao implementada.' } } }],
                });
                continue;
            }

            try {
                console.log(`[Tool]: ${call.name}(${JSON.stringify(call.args)})`);
                const result = await fn(call.args ?? {});
                contents.push({
                    role: 'user',
                    parts: [{ functionResponse: { name: call.name, response: result } }],
                });
            } catch (error) {
                contents.push({
                    role: 'user',
                    parts: [
                        {
                            functionResponse: {
                                name: call.name,
                                response: { ok: false, error: error instanceof Error ? error.message : String(error) },
                            },
                        },
                    ],
                });
            }
        }
    }

    console.error('Limite de passos atingido sem finalizar a resposta.');
}

const promptFromCli = process.argv.slice(2).join(' ').trim();
const defaultPrompt =
    'Crie um arquivo chamado logs/agent-test.txt com uma linha de confirmacao e depois leia o arquivo para validar o conteudo.';

runAgent(promptFromCli || defaultPrompt).catch((error) => {
    console.error('Erro ao executar agente:', error);
    process.exit(1);
});