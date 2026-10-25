(async function () {
  const supabaseUrl = "https://vxrmaqdezjfizlbjmpuj.supabase.co";

  const supabaseKey = "sb_publishable_th74EEn9qPhWqlvnjXpuqA_L3T3v4wC";

  const clienteAuth = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
  );

  const { data, error } = await clienteAuth.auth.getSession();

  if (error || !data.session) {
    window.location.replace("index.html");
    return;
  }

  const script = document.createElement("script");
  script.src = "script.js";
  document.body.appendChild(script);
})();
