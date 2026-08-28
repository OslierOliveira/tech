/* ========================================
   FinancasApp - Categorias
======================================== */

protegerPagina();
renderizarNav('categorias');

document.getElementById('btn-sair').addEventListener('click', () => Api.logout());

async function carregarCategorias() {
  const lista = document.getElementById('lista-categorias');
  lista.innerHTML = '<p class="estado-vazio">Carregando...</p>';

  const resposta = await Api.get('categorias');

  if (!resposta.sucesso) {
    lista.innerHTML = `<p class="estado-vazio">Erro ao carregar: ${resposta.erro}</p>`;
    return;
  }

  const categorias = resposta.dados;

  if (categorias.length === 0) {
    lista.innerHTML = '<p class="estado-vazio">Nenhuma categoria cadastrada ainda</p>';
    return;
  }

  lista.innerHTML = categorias.map((c) => {
    const ativa = c.ativo === true || c.ativo === 'TRUE';
    return `
      <div class="card-conta">
        <div class="linha-topo">
          <div class="descricao">${c.nome}</div>
          <span class="status-badge ${ativa ? 'pago' : 'vencido'}">${ativa ? 'Ativa' : 'Inativa'}</span>
        </div>
        <div class="acoes">
          <button class="botao botao-secundario" data-acao="editar" data-id="${c.id}" data-nome="${c.nome}">Editar</button>
          ${ativa ? `<button class="botao botao-perigo" data-acao="desativar" data-id="${c.id}">Desativar</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  lista.querySelectorAll('[data-acao="editar"]').forEach((botao) => {
    botao.addEventListener('click', () => abrirModal(botao.dataset.id, botao.dataset.nome));
  });
  lista.querySelectorAll('[data-acao="desativar"]').forEach((botao) => {
    botao.addEventListener('click', () => desativarCategoria(botao.dataset.id));
  });
}

async function desativarCategoria(id) {
  if (!confirm('Desativar esta categoria? Ela deixa de aparecer para novos lançamentos.')) return;
  const resposta = await Api.post('categoria_excluir', { id });
  if (!resposta.sucesso) { alert('Erro: ' + resposta.erro); return; }
  carregarCategorias();
}

/* ---------- Modal de criação/edição ---------- */

const fundoModal = document.getElementById('fundo-modal');
const formCategoria = document.getElementById('form-categoria');
const tituloModal = document.getElementById('titulo-modal');

document.getElementById('btn-nova-categoria').addEventListener('click', () => abrirModal());

document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModal);

function abrirModal(id, nome) {
  document.getElementById('campo-id').value = id || '';
  document.getElementById('campo-nome').value = nome || '';
  tituloModal.textContent = id ? 'Editar categoria' : 'Nova categoria';
  fundoModal.hidden = false;
}

function fecharModal() {
  fundoModal.hidden = true;
  formCategoria.reset();
}

formCategoria.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = document.getElementById('campo-id').value;
  const nome = document.getElementById('campo-nome').value;

  const botaoSalvar = formCategoria.querySelector('button[type="submit"]');
  botaoSalvar.disabled = true;
  botaoSalvar.textContent = 'Salvando...';

  const resposta = id
    ? await Api.post('categoria_atualizar', { id, nome })
    : await Api.post('categoria_criar', { nome });

  botaoSalvar.disabled = false;
  botaoSalvar.textContent = 'Salvar';

  if (!resposta.sucesso) {
    alert('Erro ao salvar: ' + resposta.erro);
    return;
  }

  fecharModal();
  carregarCategorias();
});

carregarCategorias();
