defmodule BackendWeb.SessionController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    user = conn.assigns.current_user
    sessions = Backend.Sessions.list_user_sessions(user.id)
    json(conn, Enum.map(sessions, &session_json/1))
  end

  def show(conn, %{"id" => id}) do
    session = Backend.Sessions.get_session!(id)
    json(conn, session_json(session))
  end

  def create(conn, %{"session" => session_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(session_params, "initiator_id", current_user.id)
    {:ok, created} = Backend.Sessions.create_session(params)
    session = Backend.Sessions.get_session!(created.id)
    json(conn, session_json(session))
  end

  def update_status(conn, %{"id" => id, "status" => status}) do
    session = Backend.Sessions.get_session!(id)
    {:ok, _} = Backend.Sessions.update_session_status(session, status)

    if status == "completed" do
      Backend.Discord.Webhook.notify_session_completed(session)
    end

    session = Backend.Sessions.get_session!(id)
    json(conn, session_json(session))
  end

  def delete(conn, %{"id" => id}) do
    session = Backend.Sessions.get_session!(id)
    {:ok, _} = Backend.Sessions.delete_session(session)
    send_resp(conn, :no_content, "")
  end

  defp session_json(session) do
    %{
      id: session.id,
      initiator: %{id: session.initiator.id, username: session.initiator.username},
      partner: session.partner && %{id: session.partner.id, username: session.partner.username},
      topic: %{id: session.topic.id, name: session.topic.name},
      status: session.status,
      scheduled_at: session.scheduled_at,
      inserted_at: session.inserted_at
    }
  end
end
