# Registo de Ocorrências — SIR Motors

Formulário web público para registo de avarias, incidentes, acidentes e outras ocorrências operacionais.

## Fluxo

Formulário Web → HTTPS POST → Power Automate → Excel Online (Business) → tbl_ocorrencias

O campo **Estado** não é enviado pelo formulário. É calculado pela fórmula existente na planilha.

## Configuração

Editar `config.js` e colocar o URL do trigger `When an HTTP request is received` em `submissionUrl`. Depois alterar `demoMode` para `false`.

## Campos enviados

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
