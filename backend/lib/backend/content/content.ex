defmodule Backend.Content do
  import Ecto.Query, warn: false
  alias Backend.Repo
  alias Backend.Content.{Topic, Question}

  def list_topics do
    Repo.all(Topic)
  end

  def get_topic!(id), do: Repo.get!(Topic, id)

  def create_topic(attrs \\ %{}) do
    %Topic{}
    |> Topic.changeset(attrs)
    |> Repo.insert()
  end

  def delete_topic(%Topic{} = topic) do
    Repo.delete(topic)
  end

  def list_questions(topic_id) do
    Repo.all(from q in Question, where: q.topic_id == ^topic_id, order_by: q.level)
  end

  def get_question!(id), do: Repo.get!(Question, id)

  def create_question(attrs \\ %{}) do
    %Question{}
    |> Question.changeset(attrs)
    |> Repo.insert()
  end

  def delete_question(%Question{} = question) do
    Repo.delete(question)
  end
end
