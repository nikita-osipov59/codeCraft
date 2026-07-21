defmodule BackendWeb.StatsController do
  use BackendWeb, :controller

  def me(conn, _params) do
    user = conn.assigns.current_user
    stats = Backend.Stats.user_stats(user.id)
    json(conn, stats)
  end
end
