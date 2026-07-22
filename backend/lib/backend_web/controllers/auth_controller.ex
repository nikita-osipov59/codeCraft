defmodule BackendWeb.AuthController do
  use BackendWeb, :controller

  def authorize(conn, _params) do
    base_url = "#{conn.scheme}://#{conn.host}:#{conn.port}"
    redirect_uri = "#{base_url}/auth/discord/callback"
    url = Backend.Discord.OAuth.authorize_url(redirect_uri)
    redirect(conn, external: url)
  end

  def callback(conn, %{"code" => code}) do
    base_url = "#{conn.scheme}://#{conn.host}:#{conn.port}"
    redirect_uri = "#{base_url}/auth/discord/callback"

    frontend_url = Application.get_env(:backend, :frontend_url) || "http://localhost:3000"

    case Backend.Discord.OAuth.login_or_register(code, redirect_uri) do
      {:ok, user} ->
        token = Phoenix.Token.sign(conn, "user auth", user.id)
        redirect(conn, external: "#{frontend_url}/auth/callback?token=#{token}&role=#{user.role}")

      {:error, _} ->
        redirect(conn, external: "#{frontend_url}/auth/callback?error=auth_failed")
    end
  end
end
