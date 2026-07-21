defmodule Backend.SessionsTest do
  use Backend.DataCase

  alias Backend.Accounts
  alias Backend.Content
  alias Backend.Sessions

  setup do
    {:ok, user} = Accounts.create_user(%{discord_id: "1", username: "alice", role: "interviewer"})
    {:ok, topic} = Content.create_topic(%{name: "DP", category: "Algorithms"})
    %{user: user, topic: topic}
  end

  test "create_board_entry/1 with valid data", %{user: user, topic: topic} do
    attrs = %{author_id: user.id, topic_id: topic.id, looking_for: "interviewee"}
    assert {:ok, %Backend.Sessions.BoardEntry{} = entry} = Sessions.create_board_entry(attrs)
    assert entry.looking_for == "interviewee"
  end

  test "list_open_entries/0", %{user: user, topic: topic} do
    Sessions.create_board_entry(%{author_id: user.id, topic_id: topic.id, looking_for: "interviewee"})
    assert length(Sessions.list_open_entries()) == 1
  end

  test "create and get session", %{user: user, topic: topic} do
    {:ok, session} = Sessions.create_session(%{initiator_id: user.id, topic_id: topic.id, status: "pending"})
    fetched = Sessions.get_session!(session.id)
    assert fetched.status == "pending"
  end

  test "create_feedback/1", %{user: user, topic: topic} do
    {:ok, session} = Sessions.create_session(%{initiator_id: user.id, topic_id: topic.id})
    attrs = %{reviewer_id: user.id, session_id: session.id, rating: 4, comment: "good session"}
    assert {:ok, %Backend.Sessions.Feedback{} = fb} = Sessions.create_feedback(attrs)
    assert fb.rating == 4
  end

  test "close_board_entry/1", %{user: user, topic: topic} do
    {:ok, entry} = Sessions.create_board_entry(%{author_id: user.id, topic_id: topic.id, looking_for: "interviewer"})
    {:ok, closed} = Sessions.close_board_entry(entry)
    assert closed.status == "closed"
  end

  test "update_session_status/2", %{user: user, topic: topic} do
    {:ok, session} = Sessions.create_session(%{initiator_id: user.id, topic_id: topic.id})
    {:ok, updated} = Sessions.update_session_status(session, "completed")
    assert updated.status == "completed"
  end
end
