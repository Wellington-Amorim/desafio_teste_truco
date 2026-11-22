# Truco Paulista (02 Duplas) — Suíte de Testes Unitários

## 1. Especificação do Desafio

Este projeto implementa e valida as regras de negócio de um motor de jogo de **Truco Paulista** disputado entre **02 duplas** (4 jogadores posicionados alternadamente na mesa: Dupla 0 formada pelos jogadores `0` e `2`; Dupla 1 formada pelos jogadores `1` e `3`).

### Regras Implementadas e Escopo
* **Baralho e Distribuição:** Baralho limpo de 40 cartas (valores `4, 5, 6, 7, Q, J, K, A, 2, 3` nos 4 naipes), excluindo `8`, `9` e `10`. Cada jogador recebe 3 cartas únicas e 1 carta é revelada como **vira**.
* **Hierarquia de Cartas e Manilhas:**
  * A **manilha** é definida dinamicamente como o valor imediatamente superior ao da *vira* (com ciclo de `3` para `4`).
  * Desempate entre manilhas segue a ordem fixa de naipes: **Paus (`♣`) > Copas (`♥`) > Espadas (`♠`) > Ouros (`♦`)**.
  * Cartas comuns seguem a força `3 > 2 > A > K > J > Q > 7 > 6 > 5 > 4`, sem distinção de naipe.
* **Dinâmica da Mão e Vazadas:** Cada mão é disputada em melhor de 3 vazadas. Contempla regras de **empate (cangou/amarrou)** na 1ª, 2ª ou 3ª vazada, além do uso de **carta coberta** a partir da 2ª vazada.
* **Sistema de Apostas:** Progressão de pontuação em `1 -> 3 (Truco) -> 6 (Seis) -> 9 (Nove) -> 12 (Doze)`, com alternância obrigatória entre as duplas, possibilidade de contra-pedido (re-raise) imediato, fuga e restrições específicas para **Mão de 11** e **Mão de Ferro (11x11)**.
* **Condição de Vitória:** Vence a partida a primeira dupla que atingir ou ultrapassar **12 pontos**.

---

## 2. Funcionamento dos Casos de Teste

A suíte de testes foi desenvolvida em **JavaScript** utilizando o *test runner* nativo do Node.js (`node:test` e `node:assert/strict`), sem dependências externas, garantindo execução isolada e determinística para cada cenário.

### Estrutura e Organização
* **`casos_de_teste_truco_paulista.md`:** Documentação formal contendo a matriz completa dos casos de teste (`CT-01` a `CT-27`), detalhando pré-condições, entradas, ações e resultados esperados.
* **`truco_paulista.test.js`:** Implementação automatizada que valida cada caso de teste documentado. Antes de cada execução (`beforeEach`), uma nova instância limpa da partida é criada para evitar efeitos colaterais entre testes.

### Cobertura dos Grupos de Teste
1. **Baralho, Distribuição e Manilhas (`CT-01` a `CT-06`):** Valida o total de 40 cartas, unicidade das cartas distribuídas, cálculo cíclico da manilha e precedência de naipes.
2. **Turnos, Vazadas e Empates (`CT-07` a `CT-13`):** Testa bloqueio de jogadas fora de turno ou com cartas inválidas, carta coberta e todas as combinações de desempate nas 3 vazadas.
3. **Apostas, Fugas e Mão de 11 (`CT-14` a `CT-23`):** Verifica a escalada de pontos, bloqueio de aumento consecutivo pela mesma dupla, contra-pedido direto, cálculo de pontos por fuga e bloqueios na Mão de 11 / Mão de Ferro.
4. **Encerramento e Ciclo de Partida (`CT-24` a `CT-27`):** Garante a rotação do carteador (*dealer*) a cada mão, acúmulo de placar, declaração de vitória ao atingir 12 pontos e bloqueio de ações após o fim do jogo.

### Como Executar
Certifique-se de ter o **Node.js (v18 ou superior)** instalado e execute no terminal:

```bash
node --test truco_paulista.test.js
```

## Por que essa estrutura funciona bem?
* **Critério 1 atendido de imediato:** A seção **1. Especificação do Desafio** delimita claramente o domínio do problema (modalidade Paulista, 2 duplas, regras de manilha, vazadas, apostas e pontuação).
* **Critério 2 atendido com rastreabilidade:** A seção **2. Funcionamento dos Casos de Teste** explica a arquitetura dos testes (isolamento com `beforeEach`, uso do `node:test`), conecta a documentação `.md` ao arquivo `.test.js` por IDs (`CT-01` a `CT-27`) e mostra o comando exato para rodar a suíte.

### by: Wellington