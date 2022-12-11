import type { NextApiRequest, NextApiResponse } from 'next'

import fetch from 'node-fetch'

const sendDiscordNotification = async ({ page, name, email }) => {
  const DISCORD_WEBHOOK = process.env.DISCORD_FEEDBACK
  try {
    if (!email) {
      throw new Error('Email required')
    }

    if (DISCORD_WEBHOOK) {
      const body = JSON.stringify({
        content: `New Saas.js signup`,
        embeds: [
          {
            fields: [
              {
                name: 'Page',
                value: page,
              },
              {
                name: 'Name',
                value: name,
              },
              { name: 'Email', value: email },
            ],
          },
        ],
      })

      const result = await fetch(DISCORD_WEBHOOK, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body,
      })

      return result
    }
  } catch (err) {
    console.error(err)
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await sendDiscordNotification({
      page: req.body.page,
      name: req.body.name,
      email: req.body.email,
    })

    res.status(200).json({
      success: true,
    })
  } catch (error) {
    return res.status(200).json({ success: false, error: error.toString() })
  }
}

export default handler
