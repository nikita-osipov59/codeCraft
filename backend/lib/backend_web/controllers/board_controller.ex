defmodule BackendWeb.BoardController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    entries = Backend.Sessions.list_open_entries()
    json(conn, Enum.map(entries, &entry_json/1))
  end

  def create(conn, %{"board_entry" => entry_params}) do
    current_user = conn.assigns.current_user
    params = Map.put(entry_params, "author_id", current_user.id)
    {:ok, entry} = Backend.Sessions.create_board_entry(params)
    Backend.Discord.Webhook.notify_new_board_entry(entry)
    entry = entry |> Backend.Repo.preload([:author, :topic])
    json(conn, entry_json(entry))
  end

  def apply(conn, %{"id" => id}) do
    current_user = conn.assigns.current_user
    entry = Backend.Sessions.get_board_entry!(id)
    {:ok, _} = Backend.Sessions.update_board_entry_status(entry, "matched")

    {:ok, _session} = Backend.Sessions.create_session(%{
      initiator_id: entry.author_id,
      partner_id: current_user.id,
      topic_id: entry.topic_id,
      board_entry_id: entry.id,
      status: "matched"
    })

    updated_entry = Backend.Sessions.get_board_entry!(id)
    json(conn, entry_json(updated_entry))
  end

  def delete(conn, %{"id" => id}) do
    entry = Backend.Sessions.get_board_entry!(id)
    {:ok, _} = Backend.Sessions.delete_board_entry(entry)
    send_resp(conn, :no_content, "")
  end

  defp entry_json(entry) do
    %{
      id: entry.id,
      author: %{id: entry.author.id, username: entry.author.username, avatar: entry.author.avatar, role: entry.author.role},
      topic: %{id: entry.topic.id, name: entry.topic.name, category: entry.topic.category},
      looking_for: entry.looking_for,
      time_slot: entry.time_slot,
      description: entry.description,
      status: entry.status,
      inserted_at: entry.inserted_at
    }
  end
end
