# Evidências da entrega do MVP — PUC-Rio

**Português** | [English](puc-rubric-evidence.en.md)

Este documento relaciona os requisitos obrigatórios da Sprint 3 à entrega do AeroEyes. A arquitetura avaliada segue o **Cenário 1.1**:

```text
AeroEyes Web → Monitoring API → AviationWeather Data API
                            ↘ PostgreSQL
```

O Attention Core é uma capacidade adicional do ecossistema AeroEyes. Ele é documentado separadamente e não é necessário para estabelecer a fronteira de três módulos do Cenário 1.1.

## Matriz de evidências

| Requisito da PUC-Rio | Implementação no AeroEyes | Evidência nos repositórios | Evidência de demonstração |
| --- | --- | --- | --- |
| Interface de usuário em HTML, CSS e JavaScript | Console EFB de monitoramento desenvolvido com React, TypeScript e Vite | `src/pages/MonitoringConsole`, `src/styles` e `Dockerfile` de produção | Abrir o Web conteinerizado e interagir com uma sessão de monitoramento |
| Interface realiza chamadas GET, POST, PUT e DELETE | O cliente Web consome os recursos de sessão e contexto da Monitoring API | `src/api/monitoringApi.ts` | `POST /sessions`, `GET /sessions/{id}`, `PUT /sessions/{id}/context` e `DELETE /sessions/{id}/context` |
| API secundária com pelo menos quatro rotas | A FastAPI expõe health check, sessões, contexto, meteorologia, eventos e modelos de leitura de atenção | Monitoring API em `src/aeroeyes_monitoring_api/api` e `/docs` | Utilizar o Swagger/OpenAPI e o fluxo do Web |
| Armazenamento persistente | O PostgreSQL persiste sessões, contexto da sessão e eventos de atenção | Repositórios SQLAlchemy e migrations do Alembic | Reiniciar a API usando o mesmo banco de dados e recuperar a sessão |
| API externa pública | A Monitoring API consome METAR do AviationWeather no backend | `aviation_weather_client.py` e `session_weather_service.py` | Configurar os códigos ICAO de origem/destino e atualizar o METAR no Web |
| Dados externos consumidos dentro da aplicação | Os dados do provedor são validados e normalizados antes de serem entregues ao Web | `GET /sessions/{id}/weather` | O painel meteorológico apresenta a observação normalizada e o METAR bruto, sem redirecionamento |
| Dockerfile para cada componente desenvolvido da entrega | Web e Monitoring API possuem um Dockerfile na raiz de seus repositórios | `aeroeyes-web/Dockerfile` e `aeroeyes-monitoring-api/Dockerfile` | Construir as imagens por meio do Docker Compose |
| Docker Compose na raiz do componente principal | O repositório Web é responsável pela composição | `compose.yaml` e `compose.env.example` | Iniciar em conjunto Web, API, job de migration e PostgreSQL |
| Imagem da arquitetura | SVG e PNG canônicos descrevem as fronteiras obrigatórias e opcionais | `docs/architecture/aeroeyes-mvp-architecture.*` | Apresentar o diagrama antes da demonstração ao vivo |
| Repositórios públicos separados | Web e Monitoring API são os dois componentes desenvolvidos do Cenário 1.1 | Links dos repositórios GitHub no README principal | Abrir os dois repositórios durante a apresentação |

## Interações HTTP obrigatórias

| Método | Rota | Ação na interface |
| --- | --- | --- |
| `GET` | `/health` | Exibir a disponibilidade da API |
| `POST` | `/sessions` | Iniciar o monitoramento |
| `GET` | `/sessions/{session_id}` | Restaurar a sessão canônica |
| `POST` | `/sessions/{session_id}/complete` | Concluir o monitoramento |
| `GET` | `/sessions/{session_id}/context` | Carregar o contexto de voo |
| `PUT` | `/sessions/{session_id}/context` | Salvar ou substituir o contexto de voo |
| `DELETE` | `/sessions/{session_id}/context` | Limpar o contexto de voo |
| `GET` | `/sessions/{session_id}/weather` | Carregar as observações METAR normalizadas |
| `GET` | `/sessions/{session_id}/attention-state` | Carregar o estado de atenção opcional mais recente |
| `GET` | `/sessions/{session_id}/events?limit=10` | Carregar os eventos opcionais recentes de atenção |

## Declaração da API externa

- Provedor: AviationWeather.gov Data API.
- Produto: observações meteorológicas de aeródromo METAR.
- Requisição realizada pelo backend: `GET https://aviationweather.gov/api/data/metar`, usando os parâmetros documentados para identificadores ICAO das estações e formato JSON.
- Autenticação: os dados meteorológicos públicos não exigem conta nem chave de API.
- Fronteira de consumo: somente a Monitoring API acessa o provedor; o navegador nunca o chama diretamente.
- Restrição operacional: as requisições são intencionalmente limitadas e iniciadas pelo usuário. O provedor documenta limites de uso e solicita que os consumidores evitem frequência excessiva de requisições.
- Documentação oficial: <https://aviationweather.gov/data/api/>

## Capacidade adicional do AeroEyes

O repositório privado do Attention Core contém o runtime nativo de câmera e calibração e um container determinístico `core-demo`. Ambos podem publicar eventos de atenção em uma `MonitoringSession` existente. Essa extensão fortalece a demonstração do projeto, mas permanece fora do conjunto mínimo de repositórios do Cenário 1.1.

Os caminhos nativo e conteinerizado são deliberadamente distintos:

- Core nativo: webcam física, interface de calibração, áudio opcional de apresentação e análise de atenção ao vivo;
- `core-demo`: observações determinísticas sem hardware para evidências de integração com Docker e CI.

## Evidências finais ainda necessárias

- Registrar as URLs das execuções de CI bem-sucedidas utilizadas na entrega.
- Executar o procedimento clean-room do #09B a partir de clones novos.
- Registrar a URL final do vídeo após a exportação.
