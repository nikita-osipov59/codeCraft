defmodule BackendWeb.TopicController do
  use BackendWeb, :controller
  action_fallback BackendWeb.FallbackController

  def index(conn, _params) do
    topics = Backend.Content.list_topics()
    json(conn, topics)
  end

  def show(conn, %{"id" => id}) do
    topic = Backend.Content.get_topic!(id)
    json(conn, %{id: topic.id, name: topic.name, category: topic.category, icon: topic.icon, description: topic.description})
  end

  def create(conn, %{"topic" => topic_params}) do
    {:ok, topic} = Backend.Content.create_topic(topic_params)
    json(conn, %{id: topic.id, name: topic.name, category: topic.category, icon: topic.icon, description: topic.description})
  end

  def delete(conn, %{"id" => id}) do
    topic = Backend.Content.get_topic!(id)
    {:ok, _} = Backend.Content.delete_topic(topic)
    send_resp(conn, :no_content, "")
  end
end
