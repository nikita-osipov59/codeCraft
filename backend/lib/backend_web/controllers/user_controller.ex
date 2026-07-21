defmodule BackendWeb.UserController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def me(conn, _params) do
    user = conn.assigns.current_user
    json(conn, %{
      id: user.id, username: user.username, avatar: user.avatar,
      role: user.role, rating: user.rating,
      sessions_count: user.sessions_count, inserted_at: user.inserted_at
    })
  end

  def show(conn, %{"id" => id}) do
    user = Backend.Accounts.get_user!(id)
    json(conn, %{
      id: user.id, username: user.username, avatar: user.avatar,
      role: user.role, rating: user.rating,
      sessions_count: user.sessions_count, inserted_at: user.inserted_at
    })
  end

  def update_role(conn, %{"role" => role}) do
    user = conn.assigns.current_user
    {:ok, user} = Backend.Accounts.update_user(user, %{role: role})
    json(conn, %{
      id: user.id, username: user.username, avatar: user.avatar,
      role: user.role, rating: user.rating,
      sessions_count: user.sessions_count, inserted_at: user.inserted_at
    })
  end
end
