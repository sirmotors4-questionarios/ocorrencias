# Registo de Ocorrências — SIR Motors

Formulário web público para registo de avarias, incidentes, acidentes e outras ocorrências operacionais.

## Fluxo

Formulário Web → HTTPS POST → Power Automate → Excel Online (Business) → tbl_ocorrencias

Os campos **ID_Ocorrencia** e **Estado** não são enviados pelo formulário. Ambos são calculados automaticamente por fórmulas existentes na planilha.

## Estrutura esperada da tbl_ocorrencias

- ID_Ocorrencia
- Data
- Hora
- Tipo_Ocorrencia
- Categoria
- Viatura
- Motorista
- Rota
- Sentido
- Local_Ocorrencia
- Descricao
- Criticidade
- Impacto
- Viatura_Imobilizada
- Operacao_Interrompida
- Passageiros_Afectados
- Houve_Feridos
- Houve_Danos_Materiais
- Estado

## Configuração

Editar `config.js` e colocar o URL do trigger `When an HTTP request is received` em `submissionUrl`. Depois alterar `demoMode` para `false`.

## Campos enviados pelo formulário

- data
- hora
- tipo_ocorrencia
- categoria
- viatura
- motorista
- rota
- sentido
- local_ocorrencia
- descricao
- criticidade
- impacto
- viatura_imobilizada
- operacao_interrompida
- passageiros_afectados
- houve_feridos
- houve_danos_materiais
