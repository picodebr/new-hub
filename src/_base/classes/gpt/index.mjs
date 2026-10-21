/* eslint-disable no-undef */
/* eslint-disable no-console */
import { OpenAI } from 'openai';

const gpt = async () => {
  const grade = 6;
  const topic = `Biologia`;
  try {
    const apiKey = ``;
    if (!apiKey) throw new Error('Not found api key');

    const openai = new OpenAI({ apiKey });

    const FINAL_PROMPT = `Me dê um exemplo de atividade maker, levando em conta a BNCC, para ensinar sobre ${topic}, para alunos do ${grade}º ANO. Liste, ao final, as habilidades da BNCC com o código, que foram usadas nessa atividade.

    Considere sempre 4 etapas, sendo a primeira etapa de contextualização do tema, envolvendo pesquisas e discussões, a segunda etapa para planejamento do que será construído, a terceira etapa de construção - nesta você pode criar um passo a passo, caso o projeto já tenha - e a última etapa de apresentação e/ou testes do que foi construído.

    Apresente o objetivo da atividade no início e, antes de falar das etapas, liste as ferramentas que serão necessárias para esse projeto.

    Por fim formule a resposta em uma estrutura JSON, restritamente e exatamente como esta: {"title": "Titulo do projeto", "objective": "Objetivo e detalhes do projeto","materials": ["material 1", "material 2"], "steps":[{"title": "Título da etapa 1", "description": "Descrição da etapa 1"},{"title": "Título da etapa 2", "description": "Descrição da etapa 2"}], "bncc": [{"Código da habilidade BNCC":"Descrição da atividade BNCC"}]}`;

    const data = await openai.completions.create({ model: 'gpt-3.5-turbo', prompt: FINAL_PROMPT });
    console.log(JSON.stringify(data, null, 4));

    const completionData = {
      ai_model: data.model,
      total_used_tokens: data.usage?.total_tokens,
      answer: { used_tokens: data.usage?.prompt_tokens, content: FINAL_PROMPT },
      response: {
        used_tokens: data.usage?.completion_tokens,
        content: JSON.parse(data.choices[0].text || '{}'),
      },
    };

    return completionData;
  } catch (error) {
    console.log(JSON.stringify(error, null, 4));
  }

  return {};
};

gpt()
