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

    case Backend.Discord.OAuth.login_or_register(code, redirect_uri) do
      {:ok, user} ->
        token = Phoenix.Token.sign(conn, "user auth", user.id)

        conn
        |> put_status(:ok)
        |> json(%{token: token, user: %{id: user.id, username: user.username, role: user.role, avatar: user.avatar}})

      {:error, _} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Authentication failed"})
    end
  end
end
