/* ========================================
   FinancasApp - Contas
======================================== */

protegerPagina();
renderizarNav('contas');

document.getElementById('btn-sair').addEventListener('click', () => Api.logout());

const hoje = new Date();
let anoAtual = hoje.getFullYear();
let mesAtual = hoje.getMonth() + 1;

document.getElementById('mes-anterior').addEventListener('click', () => mudarMes(-1));
document.getElementById('mes-proximo').addEventListener('click', () => mudarMes(1));

function mudarMes(delta) {
  mesAtual += delta;
  if (mesAtual < 1) { mesAtual = 12; anoAtual--; }
  if (mesAtual > 12) { mesAtual = 1; anoAtual++; }
  carregarContas();
}

async function carregarContas() {
  document.getElementById('mes-atual-label').textContent = `${NOMES_MESES[mesAtual - 1]} ${anoAtual}`;

  const lista = document.getElementById('lista-contas');
  lista.innerHTML = '<p class="estado-vazio">Carregando...</p>';

  const [resposta, categorias] = await Promise.all([
    Api.get('contas', { ano: anoAtual, mes: mesAtual }),
    obterCategorias()
  ]);

  if (!resposta.sucesso) {
    lista.innerHTML = `<p class="estado-vazio">Erro ao carregar: ${resposta.erro}</p>`;
    return;
  }

  const contas = resposta.dados.sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento));

  if (contas.length === 0) {
    lista.innerHTML = '<p class="estado-vazio">Nenhuma conta neste mês</p>';
    return;
  }

  lista.innerHTML = contas.map((c) => cardConta(c, categorias)).join('');

  // Liga os botões de ação depois de renderizar (delegação simples)
  lista.querySelectorAll('[data-acao="pagar"]').forEach((botao) => {
    botao.addEventListener('click', () => marcarComoPaga(botao.dataset.id, botao.dataset.valor));
  });
  lista.querySelectorAll('[data-acao="desfazer"]').forEach((botao) => {
    botao.addEventListener('click', () => desfazerPagamento(botao.dataset.id));
  });
  lista.querySelectorAll('[data-acao="excluir"]').forEach((botao) => {
    botao.addEventListener('click', () => excluirConta(botao.dataset.id));
  });
}

function cardConta(c, categorias) {
  const parcelaInfo = c.parcela_atual ? ` &middot; ${c.parcela_atual}/${c.total_parcelas}` : '';
  const statusClasse = c.status_exibicao.toLowerCase();

  const botaoAcao = c.status_exibicao === 'PAGO'
    ? `<button class="botao botao-secundario" data-acao="desfazer" data-id="${c.id}">Desfazer</button>`
    : `<button class="botao botao-primario" data-acao="pagar" data-id="${c.id}" data-valor="${c.valor_previsto}">Marcar como paga</button>`;

  return `
    <div class="card-conta">
      <div class="linha-topo">
        <div>
          <div class="descricao">${c.descricao}${parcelaInfo}</div>
          <div class="categoria">${nomeCategoria(categorias, c.categoria_id)}</div>
        </div>
        <div class="valor">${formatarMoeda(c.status_exibicao === 'PAGO' ? c.valor_pago : c.valor_previsto)}</div>
      </div>
      <div class="vencimento">
        Vence em ${formatarDataBR(c.vencimento)}
        &middot; <span class="status-badge ${statusClasse}">${c.status_exibicao}</span>
      </div>
      <div class="acoes">
        ${botaoAcao}
        <button class="botao botao-perigo" data-acao="excluir" data-id="${c.id}">Excluir</button>
      </div>
    </div>
  `;
}

async function marcarComoPaga(id, valorPrevisto) {
  const valorInformado = prompt('Valor pago:', Number(valorPrevisto).toFixed(2));
  if (valorInformado === null) return;

  const resposta = await Api.post('conta_marcar_paga', { id, valor_pago: valorInformado });
  if (!resposta.sucesso) { alert('Erro: ' + resposta.erro); return; }
  carregarContas();
}

async function desfazerPagamento(id) {
  if (!confirm('Desfazer o pagamento desta conta?')) return;
  const resposta = await Api.post('conta_marcar_pendente', { id });
  if (!resposta.sucesso) { alert('Erro: ' + resposta.erro); return; }
  carregarContas();
}

async function excluirConta(id) {
  if (!confirm('Excluir esta conta? Essa ação não pode ser desfeita.')) return;
  const resposta = await Api.post('conta_excluir', { id });
  if (!resposta.sucesso) { alert('Erro: ' + resposta.erro); return; }
  carregarContas();
}

/* ---------- Modal de nova conta avulsa ---------- */

const fundoModal = document.getElementById('fundo-modal');
const formNovaConta = document.getElementById('form-nova-conta');

document.getElementById('btn-nova-conta').addEventListener('click', async () => {
  await preencherSelectCategorias();
  fundoModal.hidden = false;
});

document.getElementById('btn-cancelar-modal').addEventListener('click', () => {
  fundoModal.hidden = true;
  formNovaConta.reset();
});

async function preencherSelectCategorias() {
  const categorias = await obterCategorias();
  const select = document.getElementById('campo-categoria');
  select.innerHTML = categorias
    .filter((c) => c.ativo === true || c.ativo === 'TRUE')
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join('');
}

formNovaConta.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const botaoSalvar = formNovaConta.querySelector('button[type="submit"]');
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Salvando...';

  const resposta = await Api.post('conta_criar', {
    descricao: document.getElementById('campo-descricao').value,
    categoria_id: document.getElementById('campo-categoria').value,
    valor_previsto: document.getElementById('campo-valor').value,
    vencimento: document.getElementById('campo-vencimento').value,
    observacao: document.getElementById('campo-observacao').value
  });

  botaoSalvar.disabled = false;
  botaoSalvar.textContent = 'Salvar';

  if (!resposta.sucesso) {
    alert('Erro ao salvar: ' + resposta.erro);
    return;
  }

  fundoModal.hidden = true;
  formNovaConta.reset();
  carregarContas();
});

carregarContas();
