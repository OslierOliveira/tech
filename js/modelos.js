/* ========================================
   FinancasApp - Modelos (contas fixas)
======================================== */

protegerPagina();
renderizarNav('modelos');

document.getElementById('btn-sair').addEventListener('click', () => Api.logout());

const campoTipo = document.getElementById('campo-tipo');
const campoParcelasContainer = document.getElementById('campo-parcelas-container');
const campoParcelas = document.getElementById('campo-parcelas');

campoTipo.addEventListener('change', atualizarVisibilidadeParcelas);

function atualizarVisibilidadeParcelas() {
  const parcelada = campoTipo.value === 'fixa_parcelada';
  campoParcelasContainer.hidden = !parcelada;
  campoParcelas.required = parcelada;
}

async function carregarModelos() {
  const lista = document.getElementById('lista-modelos');
  lista.innerHTML = '<p class="estado-vazio">Carregando...</p>';

  const [resposta, categorias] = await Promise.all([
    Api.get('modelos'),
    obterCategorias()
  ]);

  if (!resposta.sucesso) {
    lista.innerHTML = `<p class="estado-vazio">Erro ao carregar: ${resposta.erro}</p>`;
    return;
  }

  const modelos = resposta.dados;

  if (modelos.length === 0) {
    lista.innerHTML = '<p class="estado-vazio">Nenhuma conta fixa cadastrada ainda</p>';
    return;
  }

  lista.innerHTML = modelos.map((m) => cardModelo(m, categorias)).join('');

  lista.querySelectorAll('[data-acao="editar"]').forEach((botao) => {
    botao.addEventListener('click', () => abrirModalEdicao(botao.dataset.id, modelos));
  });
  lista.querySelectorAll('[data-acao="desativar"]').forEach((botao) => {
    botao.addEventListener('click', () => desativarModelo(botao.dataset.id));
  });
}

function cardModelo(m, categorias) {
  const ativo = m.ativo === true || m.ativo === 'TRUE';
  const tipoTexto = m.tipo === 'fixa_mensal' ? 'Fixa mensal' : `Parcelada (${m.quantidade_parcelas}x)`;

  return `
    <div class="card-conta">
      <div class="linha-topo">
        <div>
          <div class="descricao">${m.descricao}</div>
          <div class="categoria">${nomeCategoria(categorias, m.categoria_id)} &middot; ${tipoTexto}</div>
        </div>
        <div class="valor">${formatarMoeda(m.valor)}</div>
      </div>
      <div class="vencimento">
        Vence todo dia ${m.dia_vencimento} &middot; desde ${formatarDataBR(m.data_inicio)}
        &middot; <span class="status-badge ${ativo ? 'pago' : 'vencido'}">${ativo ? 'Ativa' : 'Inativa'}</span>
      </div>
      <div class="acoes">
        <button class="botao botao-secundario" data-acao="editar" data-id="${m.id}">Editar</button>
        ${ativo ? `<button class="botao botao-perigo" data-acao="desativar" data-id="${m.id}">Desativar</button>` : ''}
      </div>
    </div>
  `;
}

async function desativarModelo(id) {
  if (!confirm('Desativar esta conta fixa? As parcelas já geradas continuam existindo, mas nenhuma nova será criada.')) return;
  const resposta = await Api.post('modelo_excluir', { id });
  if (!resposta.sucesso) { alert('Erro: ' + resposta.erro); return; }
  carregarModelos();
}

/* ---------- Modal de criação/edição ---------- */

const fundoModal = document.getElementById('fundo-modal');
const formModelo = document.getElementById('form-modelo');
const tituloModal = document.getElementById('titulo-modal');

document.getElementById('btn-novo-modelo').addEventListener('click', async () => {
  await preencherSelectCategorias();
  document.getElementById('campo-id').value = '';
  tituloModal.textContent = 'Nova conta fixa';
  atualizarVisibilidadeParcelas();
  fundoModal.hidden = false;
});

document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);

function fecharModal() {
  fundoModal.hidden = true;
  formModelo.reset();
}

async function preencherSelectCategorias() {
  const categorias = await obterCategorias();
  const select = document.getElementById('campo-categoria');
  select.innerHTML = categorias
    .filter((c) => c.ativo === true || c.ativo === 'TRUE')
    .map((c) => `<option value="${c.id}">${c.nome}</option>`)
    .join('');
}

async function abrirModalEdicao(id, modelos) {
  const modelo = modelos.find((m) => Number(m.id) === Number(id));
  if (!modelo) return;

  await preencherSelectCategorias();

  document.getElementById('campo-id').value = modelo.id;
  document.getElementById('campo-tipo').value = modelo.tipo;
  document.getElementById('campo-descricao').value = modelo.descricao;
  document.getElementById('campo-categoria').value = modelo.categoria_id;
  document.getElementById('campo-valor').value = modelo.valor;
  document.getElementById('campo-dia-vencimento').value = modelo.dia_vencimento;
  document.getElementById('campo-data-inicio').value = String(modelo.data_inicio).slice(0, 7);
  document.getElementById('campo-parcelas').value = modelo.quantidade_parcelas || '';

  tituloModal.textContent = 'Editar conta fixa';
  atualizarVisibilidadeParcelas();
  fundoModal.hidden = false;
}

formModelo.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = document.getElementById('campo-id').value;
  const mesInicio = document.getElementById('campo-data-inicio').value; // "AAAA-MM"

  const dados = {
    tipo: campoTipo.value,
    descricao: document.getElementById('campo-descricao').value,
    categoria_id: document.getElementById('campo-categoria').value,
    valor: document.getElementById('campo-valor').value,
    dia_vencimento: document.getElementById('campo-dia-vencimento').value,
    data_inicio: `${mesInicio}-01`,
    quantidade_parcelas: campoTipo.value === 'fixa_parcelada' ? campoParcelas.value : ''
  };

  if (id) dados.id = id;

  const botaoSalvar = formModelo.querySelector('button[type="submit"]');
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Salvando...';

  const resposta = id
    ? await Api.post('modelo_atualizar', dados)
    : await Api.post('modelo_criar', dados);

  botaoSalvar.disabled = false;
  botaoSalvar.textContent = 'Salvar';

  if (!resposta.sucesso) {
    alert('Erro ao salvar: ' + resposta.erro);
    return;
  }

  fecharModal();
  carregarModelos();
});

carregarModelos();
