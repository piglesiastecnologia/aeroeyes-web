# Diagramas de arquitetura do AeroEyes

Esta pasta mantém duas representações da mesma arquitetura canônica:

- `aeroeyes-mvp-architecture.svg`: versão visual refinada e editável;
- `aeroeyes-mvp-architecture.png`: exportação estável usada no README e na apresentação;
- `aeroeyes-mvp-architecture.mmd`: fonte Mermaid compacta, renderizada diretamente pelo GitHub.

O SVG/PNG é o artefato principal da banca porque oferece controle preciso de
hierarquia, identidade visual e legibilidade. O Mermaid é complementar: torna
o fluxo fácil de revisar em diff e simples de atualizar quando um contrato ou
componente mudar.

## Versão Mermaid

```mermaid
flowchart LR
    Operator([Operador / Browser])

    subgraph Required["ENTREGA PUC-RIO · CENÁRIO 1.1"]
        Web["AeroEyes Web"] -->|"GET · POST · PUT · DELETE"| API["Monitoring API"]
        API --> DB[(PostgreSQL)]
        API -->|"GET METAR"| Weather["AviationWeather"]
    end

    Operator --> Web

    subgraph Optional["EXTENSÃO OPCIONAL"]
        Camera([Webcam]) --> Native["Attention Core nativo"]
        Demo["core-demo determinístico"]
    end

    Native -. "POST /events" .-> API
    Demo -. "POST /events" .-> API
```

O diagrama não representa gateway, mensageria, cache, réplica, autenticação ou
observabilidade porque esses componentes não pertencem ao MVP implementado.
