defmodule Backend.Discord.OAuth do
  @discord_authorize_url "https://discord.com/api/oauth2/authorize"
  @discord_token_url "https://discord.com/api/oauth2/token"
  @discord_user_url "https://discord.com/api/users/@me"

  def authorize_url(redirect_uri) do
    client_id = Application.get_env(:backend, :discord_client_id) || System.get_env("DISCORD_CLIENT_ID")
    "#{@discord_authorize_url}?client_id=#{client_id}&redirect_uri=#{URI.encode_www_form(redirect_uri)}&response_type=code&scope=identify"
  end

  def get_token(code, redirect_uri) do
    client_id = Application.get_env(:backend, :discord_client_id)
    client_secret = Application.get_env(:backend, :discord_client_secret)

    body = %{
      client_id: client_id,
      client_secret: client_secret,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri
    }

    headers = [{"Content-Type", "application/x-www-form-urlencoded"}]

    case Req.post(@discord_token_url, body: URI.encode_query(body), headers: headers) do
      {:ok, %{status: 200, body: %{"access_token" => token}}} ->
        {:ok, token}

      other ->
        {:error, other}
    end
  end

  def get_user_info(access_token) do
    headers = [{"Authorization", "Bearer #{access_token}"}]

    case Req.get(@discord_user_url, headers: headers) do
      {:ok, %{status: 200, body: body}} ->
        avatar_url = if body["avatar"] do
          "https://cdn.discordapp.com/avatars/#{body["id"]}/#{body["avatar"]}.png"
        else
          nil
        end

        {:ok, %{
          discord_id: body["id"],
          username: body["username"],
          avatar: avatar_url
        }}

      other ->
        {:error, other}
    end
  end

  def login_or_register(code, redirect_uri) do
    with {:ok, token} <- get_token(code, redirect_uri),
         {:ok, user_info} <- get_user_info(token) do
      case Backend.Accounts.get_user_by_discord_id(user_info.discord_id) do
        nil ->
          Backend.Accounts.create_user(%{
            discord_id: user_info.discord_id,
            username: user_info.username,
            avatar: user_info.avatar,
            role: "both"
          })
        user ->
          {:ok, user}
      end
    end
  end
end
