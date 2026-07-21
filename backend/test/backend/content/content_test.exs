defmodule Backend.ContentTest do
  use Backend.DataCase

  alias Backend.Content

  test "create_topic/1 with valid data creates a topic" do
    attrs = %{name: "Arrays & Hashing", category: "Algorithms", description: "Array manipulation and hash map problems"}
    assert {:ok, %Backend.Content.Topic{} = topic} = Content.create_topic(attrs)
    assert topic.name == "Arrays & Hashing"
  end

  test "list_topics/0 returns all topics" do
    Content.create_topic(%{name: "Trees", category: "Algorithms"})
    Content.create_topic(%{name: "System Design", category: "System Design"})
    assert length(Content.list_topics()) == 2
  end

  test "create_question/1 with valid data creates question" do
    {:ok, topic} = Content.create_topic(%{name: "Test", category: "Test"})
    attrs = %{topic_id: topic.id, level: "middle", text: "What is a hash map?"}
    assert {:ok, %Backend.Content.Question{} = q} = Content.create_question(attrs)
    assert q.text == "What is a hash map?"
    assert q.level == "middle"
  end

  test "list_questions/1 returns questions for topic" do
    {:ok, topic} = Content.create_topic(%{name: "Test", category: "Test"})
    Content.create_question(%{topic_id: topic.id, level: "junior", text: "Q1"})
    Content.create_question(%{topic_id: topic.id, level: "senior", text: "Q2"})
    assert length(Content.list_questions(topic.id)) == 2
  end

  test "delete_topic/1 deletes topic" do
    {:ok, topic} = Content.create_topic(%{name: "ToDelete", category: "Test"})
    assert {:ok, _} = Content.delete_topic(topic)
    assert length(Content.list_topics()) == 0
  end
end
