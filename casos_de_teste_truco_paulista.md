# Casos de Teste — Truco Paulista (02 Duplas)

## 1. Baralho, Distribuição e Hierarquia de Cartas

* **CT-01 (Composição do Baralho):** O baralho deve conter exatamente 40 cartas (4 naipes × 10 valores: `4, 5, 6, 7, Q, J, K, A, 2, 3`), excluindo `8, 9, 10` e curingas.
* **CT-02 (Distribuição e Unicidade):** Em uma partida de 2 duplas (`J0` e `J2` vs. `J1` e `J3`), cada jogador recebe 3 cartas distintas e 1 carta distinta é virada como **vira** (totalizando 13 cartas únicas retiradas do baralho).
* **CT-03 (Definição da Manilha e Wrap-around):** A manilha é o valor imediatamente superior ao da vira na sequência `4 -> 5 -> 6 -> 7 -> Q -> J -> K -> A -> 2 -> 3 -> 4`. Quando a vira for `3`, a manilha deve ser `4`.
* **CT-04 (Hierarquia entre Manilhas):** Entre manilhas de naipes diferentes, a força deve obedecer estritamente à ordem: **Paus (`♣`) > Copas (`♥`) > Espadas (`♠`) > Ouros (`♦`)**.
* **CT-05 (Hierarquia de Cartas Comuns):** Cartas não-manilhas devem obedecer à ordem: `3 > 2 > A > K > J > Q > 7 > 6 > 5 > 4`, sem distinção de naipe.
* **CT-06 (Supremacia da Manilha):** Qualquer manilha (inclusive Ouros) deve vencer a carta comum mais forte (`3` de qualquer naipe).

## 2. Turnos, Carta Coberta e Vazadas

* **CT-07 (Controle de Turno):** O sistema deve bloquear qualquer tentativa de jogada realizada por um jogador fora de sua vez.
* **CT-08 (Validação de Posse de Carta):** O sistema deve bloquear a jogada de uma carta que não pertença à mão atual do jogador.
* **CT-09 (Vitória Direta em 2 Vazadas):** A dupla que vencer 2 vazadas vence a mão imediatamente, sem necessidade de jogar a 3ª vazada.
* **CT-10 (Empate na 1ª Vazada - Cangou):** Se a 1ª vazada empatar, vence a mão a dupla que ganhar a 2ª vazada.
* **CT-11 (Empate na 2ª Vazada):** Se uma dupla venceu a 1ª vazada e a 2ª empatar, vence a mão a dupla vencedora da 1ª vazada.
* **CT-12A (Empate na 3ª Vazada após vitória alternada):** Se cada dupla venceu uma das duas primeiras vazadas e a 3ª empatar, vence a mão quem ganhou a 1ª vazada.
* **CT-12B (Empate na 1ª e 2ª Vazadas):** Se a 1ª e a 2ª vazadas empatarem, vence a mão quem ganhar a 3ª vazada.
* **CT-12C (Empate Triplo):** Se todas as 3 vazadas empatarem, a mão termina empatada e nenhuma dupla recebe pontos.
* **CT-13 (Carta Coberta):** A partir da 2ª vazada, um jogador pode jogar uma carta coberta (virada para baixo), que possui força nula (`-1`) e perde para qualquer carta aberta. Na 1ª vazada, jogar carta coberta deve ser bloqueado.
* **CT-14 (Pontuação Base):** Uma mão vencida sem pedidos de aumento deve somar exatamente `1` ponto à dupla vencedora.

## 3. Pedidos de Truco, Seis, Nove e Doze

* **CT-15 (Pedido de Truco no Turno):** Um jogador pode pedir Truco no seu turno, elevando a aposta pendente de `1` para `3`.
* **CT-16 (Bloqueio de Aumento Consecutivo):** A mesma dupla não pode aumentar a aposta duas vezes seguidas sem que a dupla adversária tenha respondido.
* **CT-17 (Progressão Completa de Apostas):** O sistema deve permitir a escalada `1 -> 3 (Truco) -> 6 (Seis) -> 9 (Nove) -> 12 (Doze)` com aceites alternados entre as duplas.
* **CT-18 (Contra-pedido Imediato / Re-raise):** Ao receber um pedido (ex.: Truco vale `3`), a dupla adversária pode responder aumentando diretamente para o próximo nível (ex.: pedir Seis vale `6`), transferindo a decisão de aceitar/correr/aumentar para a dupla original.
* **CT-19 (Fuga / Correr do Pedido):** Se a dupla adversária correr de um pedido, a mão encerra imediatamente e a dupla solicitante ganha os pontos vigentes antes do aumento (`1`, `3`, `6` ou `9`).
* **CT-20 (Limite Máximo de 12 Pontos):** Qualquer tentativa de pedir aumento quando a mão já vale `12` deve ser bloqueada.

## 4. Mão de 11, Mão de Ferro e Encerramento da Partida

* **CT-21 (Mão de 11 — Decisão de Jogar ou Correr):** Quando apenas uma dupla atinge `11` pontos, ela deve decidir antes das jogadas se aceita jogar a mão (que passa a valer `3` pontos) ou se corre (adversário ganha `1` ponto).
* **CT-22 (Mão de 11 — Proibição de Truco):** Na Mão de 11, nenhuma dupla pode pedir Truco; se a dupla com 11 pontos tentar pedir, perde a mão imediatamente (adversário ganha `1` ponto).
* **CT-23 (Mão de Ferro — 11 x 11):** Quando ambas as duplas estão com `11` pontos, a mão é jogada "no escuro" (sem decisão de correr e sem permissão para pedir truco), valendo `1` ponto decisivo.
* **CT-24 (Rotação de Carteador e Início de Mão):** Ao encerrar uma mão sem vencedor da partida, o carteador rotaciona no sentido horário (`(dealer + 1) % 4`) e o jogador à sua esquerda inicia a nova mão.
* **CT-25 (Encerramento da Partida):** A partida encerra assim que uma dupla atingir `12` ou mais pontos (`>= 12`), bloqueando quaisquer novas ações ou início de novas mãos.