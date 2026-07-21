defmodule Backend.Sessions do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Sessions.{BoardEntry, Session, Feedback}

  def list_open_entries do
    Repo.all(
      from e in BoardEntry,
      where: e.status == "open",
      preload: [:author, :topic],
      order_by: [desc: e.inserted_at]
    )
  end

  def get_board_entry!(id), do: Repo.get!(BoardEntry, id) |> Repo.preload([:author, :topic])

  def create_board_entry(attrs \\ %{}) do
    %BoardEntry{}
    |> BoardEntry.changeset(attrs)
    |> Repo.insert()
  end

  def close_board_entry(%BoardEntry{} = entry) do
    entry
    |> BoardEntry.changeset(%{status: "closed"})
    |> Repo.update()
  end

  def delete_board_entry(%BoardEntry{} = entry) do
    Repo.delete(entry)
  end

  def list_user_sessions(user_id) do
    Repo.all(
      from s in Session,
      where: s.initiator_id == ^user_id or s.partner_id == ^user_id,
      preload: [:initiator, :partner, :topic],
      order_by: [desc: s.inserted_at]
    )
  end

  def get_session!(id) do
    Repo.get!(Session, id) |> Repo.preload([:initiator, :partner, :topic, :board_entry])
  end

  def create_session(attrs \\ %{}) do
    %Session{}
    |> Session.changeset(attrs)
    |> Repo.insert()
  end

  def update_session_status(%Session{} = session, status) do
    session
    |> Session.changeset(%{status: status})
    |> Repo.update()
  end

  def delete_session(%Session{} = session) do
    Repo.delete(session)
  end

  def create_feedback(attrs \\ %{}) do
    %Feedback{}
    |> Feedback.changeset(attrs)
    |> Repo.insert()
  end
end
