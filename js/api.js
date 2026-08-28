/* ========================================
   FinancasApp - Cliente da API
   Centraliza todas as chamadas ao Apps
   Script e guarda a senha da sessão.
======================================== */

const API_URL = 'https://script.google.com/macros/s/AKfycbxoc9SWszhMMI78VVpaPzxs23cEImshL46ujdxfXG_zPhWbg05giruUPV4aMHQqhvCW/exec'; // ex: https://script.google.com/macros/s/XXXX/exec

const Api = {

  getSenha() {
    return sessionStorage.getItem('financasapp_senha') || '';
  },

  setSenha(senha) {
    sessionStorage.setItem('financasapp_senha', senha);
  },

  logout() {
    sessionStorage.removeItem('financasapp_senha');
    window.location.href = this._caminhoRaiz();
  },

  _caminhoRaiz() {
    // Funciona tanto em /index.html quanto em /pages/algo.html
    return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
  },

  async login(senha) {
    const url = `${API_URL}?action=login&senha=${encodeURIComponent(senha)}`;
    const resp = await fetch(url);
    const dados = await resp.json();
    if (dados.sucesso) this.setSenha(senha);
    return dados.sucesso;
  },

  async get(action, params = {}) {
    const query = new URLSearchParams({ action, senha: this.getSenha(), ...params });
    const resp = await fetch(`${API_URL}?${query.toString()}`);
    const dados = await resp.json();
    this._checarAutorizacao(dados);
    return dados;
  },

  async post(action, dados = {}) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, senha: this.getSenha(), ...dados })
    });
    const resultado = await resp.json();
    this._checarAutorizacao(resultado);
    return resultado;
  },

  _checarAutorizacao(resposta) {
    if (!resposta.sucesso && resposta.erro === 'Senha inválida ou não informada') {
      this.logout();
    }
  }

};
