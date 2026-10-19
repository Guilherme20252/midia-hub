const form = document.getElementById('auth-form');
const title = document.getElementById('auth-title');
const nameInput = document.getElementById('name');
const submitBtn = document.getElementById('submit-btn');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-mode');
const errorBox = document.getElementById('auth-error');

let mode = 'login'; // ou 'register'

// quem já está logado vai direto pro site
if (getToken()) location.href = 'index.html';

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function setMode(newMode) {
  mode = newMode;
  const isRegister = mode === 'register';
  title.textContent = isRegister ? 'Criar conta' : 'Entrar';
  submitBtn.textContent = isRegister ? 'Cadastrar' : 'Entrar';
  toggleText.textContent = isRegister ? 'Já tem conta?' : 'Não tem conta?';
  toggleLink.textContent = isRegister ? 'Entrar' : 'Cadastre-se';
  nameInput.hidden = !isRegister;
  nameInput.required = isRegister;
  showError('');
}

toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  setMode(mode === 'login' ? 'register' : 'login');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');

  const body = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value,
  };
  if (mode === 'register') body.name = nameInput.value.trim();

  submitBtn.disabled = true;
  submitBtn.textContent = 'Aguarde...';

  try {
    const data = await request(`/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    location.href = 'index.html';
  } catch (err) {
    showError(err.message);
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'register' ? 'Cadastrar' : 'Entrar';
  }
});
