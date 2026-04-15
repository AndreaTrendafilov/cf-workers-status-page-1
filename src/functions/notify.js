import config from '../generated/config.json'

const getOperationalLabel = (operational) => {
  return operational
    ? config.settings.monitorLabelOperational
    : config.settings.monitorLabelNotOperational
}

export async function notifySlack(monitor, operational, env) {
  const url = env.SECRET_SLACK_WEBHOOK_URL
  const payload = {
    attachments: [
      {
        fallback: `Monitor ${monitor.name} changed status to ${getOperationalLabel(operational)}`,
        color: operational ? '#36a64f' : '#f2c744',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Monitor *${
                monitor.name
              }* changed status to *${getOperationalLabel(operational)}*`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${operational ? ':white_check_mark:' : ':x:'} \`${
                  monitor.method ? monitor.method : 'GET'
                } ${monitor.url}\` - :eyes: <${
                  config.settings.url
                }|Status Page>`,
              },
            ],
          },
        ],
      },
    ],
  }
  return fetch(url, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function notifyTelegram(monitor, operational, env) {
  const text = `Monitor *${monitor.name.replaceAll(
    '-',
    '\\-',
  )}* changed status to *${getOperationalLabel(operational)}*
  ${operational ? '✅' : '❌'} \`${monitor.method ? monitor.method : 'GET'} ${
    monitor.url
  }\` \\- 👀 [Status Page](${config.settings.url})`

  const payload = new FormData()
  payload.append('chat_id', env.SECRET_TELEGRAM_CHAT_ID)
  payload.append('parse_mode', 'MarkdownV2')
  payload.append('text', text)

  const telegramUrl = `https://api.telegram.org/bot${env.SECRET_TELEGRAM_API_TOKEN}/sendMessage`
  return fetch(telegramUrl, {
    body: payload,
    method: 'POST',
  })
}

export async function notifyDiscord(monitor, operational, env) {
  const payload = {
    username: `${config.settings.title}`,
    avatar_url: `${config.settings.url}/${config.settings.logo}`,
    embeds: [
      {
        title: `${monitor.name} is ${getOperationalLabel(operational)} ${
          operational ? ':white_check_mark:' : ':x:'
        }`,
        description: `\`${monitor.method ? monitor.method : 'GET'} ${
          monitor.url
        }\` - :eyes: [Status Page](${config.settings.url})`,
        color: operational ? 3581519 : 13632027,
      },
    ],
  }
  return fetch(env.SECRET_DISCORD_WEBHOOK_URL, {
    body: JSON.stringify(payload),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
}
