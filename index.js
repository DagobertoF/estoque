
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;
    const mensagem = document.getElementById("mensagemLogin");
    const botao = loginForm.querySelector('button[type="submit"]');

    mensagem.textContent = "";
    botao.disabled = true;
    botao.textContent = "Entrando...";

    const { error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      console.error("Erro no login:", error.message);
      mensagem.textContent = "Não foi possível entrar. Confira seu e-mail e senha.";
      botao.disabled = false;
      botao.textContent = "Entrar";
      return;
    }

    window.location.href = "dashboard.html";
  });
}
