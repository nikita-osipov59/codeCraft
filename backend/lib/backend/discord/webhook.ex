defmodule Backend.Discord.Webhook do
  defp webhook_url, do: Application.get_env(:backend, :discord_webhook_url)

  def notify_new_board_entry(entry) do
    entry = entry |> Backend.Repo.preload([:author, :topic])

    message = %{
      content: nil,
      embeds: [%{
        title: "Новое объявление на доске!",
        description: "#{entry.author.username} ищет **#{entry.looking_for}** для собеса по **#{entry.topic.name}**",
        color: 5814783,
        fields: [
          %{name: "Описание", value: entry.description || "Без описания", inline: false},
          %{name: "Статус", value: "Открыто", inline: true}
        ],
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }

    send(message)
  end

  def notify_match(session) do
    session = session |> Backend.Repo.preload([:initiator, :partner, :topic])

    message = %{
      content: nil,
      embeds: [%{
        title: "Пара найдена!",
        description: "#{session.initiator.username} и #{session.partner.username} — собеседование по **#{session.topic.name}**",
        color: 5763719,
        fields: [
          %{name: "Инициатор", value: session.initiator.username, inline: true},
          %{name: "Напарник", value: session.partner.username, inline: true}
        ],
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }

    send(message)
  end

  def notify_session_completed(session) do
    session = session |> Backend.Repo.preload([:initiator, :partner, :topic])

    message = %{
      content: nil,
      embeds: [%{
        title: "Собеседование завершено!",
        description: "#{session.initiator.username} и #{session.partner.username} завершили собес по **#{session.topic.name}**",
        color: 10181046,
        timestamp: DateTime.utc_now() |> DateTime.to_iso8601()
      }]
    }

    send(message)
  end

  defp send(payload) do
    if url = webhook_url() do
      Req.post(url, json: payload)
    end
  end
end
