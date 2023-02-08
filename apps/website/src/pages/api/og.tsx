import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const config = {
  runtime: 'experimental-edge',
}

const font = fetch(
  new URL('../../../public/fonts/Inter-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer())
const fontMedium = fetch(
  new URL('../../../public/fonts/Inter-Medium.ttf', import.meta.url)
).then((res) => res.arrayBuffer())

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fontData = await font
    const fontDataBold = await fontMedium
    // ?title=<title>
    const hasTitle = searchParams.has('title')
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'Building blocks for rapid SaaS development'
    const description = hasTitle
      ? searchParams.get('description')?.slice(0, 200)
      : undefined

    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    return new ImageResponse(
      (
        <div
          style={{
            backgroundColor: 'black',
            height: '100%',
            width: '100%',
            display: 'flex',
            textAlign: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            flexWrap: 'nowrap',
          }}
        >
          <img
            src={`${host}/img/og-background.png`}
            width="100%"
            height="100%"
          />
          <div
            style={{
              background:
                'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)',
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: '0',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              justifyItems: 'center',
              position: 'absolute',
              top: '60px',
              left: '60px',
              zIndex: 10,
            }}
          >
            <img
              alt="Saas.js"
              height="60"
              src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgdmVyc2lvbj0iMS4xIgogICBpZD0iTGF5ZXJfMSIKICAgeD0iMCIKICAgeT0iMCIKICAgdmlld0JveD0iMCAwIDU1MCAxNzIiCiAgIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDU1MCAxNzIiCiAgIHhtbDpzcGFjZT0icHJlc2VydmUiCiAgIHNvZGlwb2RpOmRvY25hbWU9InNhYXMtanMtbG9nby5zdmciCiAgIGlua3NjYXBlOnZlcnNpb249IjEuMi1iZXRhICgxYjY1MTgyYywgMjAyMi0wNC0wNSkiCiAgIGlua3NjYXBlOmV4cG9ydC1maWxlbmFtZT0ic2Fhcy1qcy1sb2dvLXdlYi5zdmciCiAgIGlua3NjYXBlOmV4cG9ydC14ZHBpPSI5NiIKICAgaW5rc2NhcGU6ZXhwb3J0LXlkcGk9Ijk2IgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzCiAgICAgaWQ9ImRlZnMzMjUiIC8+PHNvZGlwb2RpOm5hbWVkdmlldwogICAgIGlkPSJuYW1lZHZpZXczMjMiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjMDAwMDAwIgogICAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgICAgaW5rc2NhcGU6cGFnZXNoYWRvdz0iMiIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICAgIGlua3NjYXBlOnBhZ2VjaGVja2VyYm9hcmQ9IjAiCiAgICAgaW5rc2NhcGU6ZGVza2NvbG9yPSIjZDFkMWQxIgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTp6b29tPSIwLjQ2MzIzMTIiCiAgICAgaW5rc2NhcGU6Y3g9IjM5OC4yODkyMyIKICAgICBpbmtzY2FwZTpjeT0iLTIzNC4yMjQyOSIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjExMTgiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iMTIwNSIKICAgICBpbmtzY2FwZTp3aW5kb3cteD0iODU5IgogICAgIGlua3NjYXBlOndpbmRvdy15PSIyNSIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIwIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9IkxheWVyXzEiIC8+PHN0eWxlCiAgICAgaWQ9InN0eWxlMzE0Ij4uc3Qwe2ZpbGw6I2ZmZn0uc3Qxe2ZpbGw6I2ZmZn08L3N0eWxlPjxwYXRoCiAgICAgY2xhc3M9InN0MCIKICAgICBkPSJNMTE3LjY3IDE2LjU5aC01NGMtMS44NiAwLTMuMzYgMS41LTMuMzYgMy4zNlY0Ni4yYzAgMi4xMS0uODkgNC4xMS0yLjQ2IDUuNTJsLS4xLjA5YTcuNDM4IDcuNDM4IDAgMCAxLTQuOTYgMS45SDIwLjI0Yy0xLjg2IDAtMy4zNiAxLjUtMy4zNiAzLjM2djM4LjQ0YzAgMS44NiAxLjUgMy4zNiAzLjM2IDMuMzZoMzQuNTFjMS44NiAwIDMuMzYtMS41IDMuMzYtMy4zNlY1OS4yNWMwLTIuMTEuODktNC4xMSAyLjQ2LTUuNTJhNy40MzggNy40MzggMCAwIDEgNC45Ni0xLjloNTIuMTVjMS44NiAwIDMuMzYtMS41IDMuMzYtMy4zNlYxOS45NWEzLjM3IDMuMzcgMCAwIDAtMy4zNy0zLjM2eiIKICAgICBpZD0icGF0aDMxNiIgLz48cGF0aAogICAgIGNsYXNzPSJzdDAiCiAgICAgZD0iTTExNy42NyA3Mi43OGgtMzQuNWMtMS44NiAwLTMuMzYgMS41LTMuMzYgMy4zNnYzNi4yN2MwIDIuMTEtLjg5IDQuMTEtMi40NiA1LjUyYTcuNDM4IDcuNDM4IDAgMCAxLTQuOTYgMS45SDIwLjI0Yy0xLjg2IDAtMy4zNiAxLjUtMy4zNiAzLjM2djI4LjU2YzAgMS44NiAxLjUgMy4zNiAzLjM2IDMuMzZoNTRjMS44NiAwIDMuMzYtMS41IDMuMzYtMy4zNnYtMjYuM2MwLTIuMTEuODktNC4xMSAyLjQ2LTUuNTJsLjEtLjA5YTcuNDM4IDcuNDM4IDAgMCAxIDQuOTYtMS45aDMyLjU0YzEuODYgMCAzLjM2LTEuNSAzLjM2LTMuMzZWNzYuMTNhMy4zMzcgMy4zMzcgMCAwIDAtMy4zNS0zLjM1eiIKICAgICBpZD0icGF0aDMxOCIgLz48ZwogICAgIGlkPSJnMTA0MCI+PHBhdGgKICAgICAgIGNsYXNzPSJzdDEiCiAgICAgICBkPSJtIDIyMS43LDU4LjA4IC01LjM1LDEwLjgyIGMgLTUuOTksLTMuNjkgLTEzLjUsLTUuOTkgLTE5LjQ4LC01Ljk5IC01LjczLDAgLTkuOTMsMS45MSAtOS45Myw2Ljc1IDAsMTIuNDggMzYuMDQsNS43MyAzNS45MSwzMC4zMSAwLDEzLjg4IC0xMi4zNSwyMC4xMiAtMjUuOTgsMjAuMTIgLTkuOTMsMCAtMjAuNSwtMy4zMSAtMjcuMjUsLTkuNDIgbCA1LjIyLC0xMC40NCBjIDUuODYsNS4yMiAxNS4yOCw4LjQgMjIuNjcsOC40IDYuMjQsMCAxMS4wOCwtMi4xNyAxMS4wOCwtNy4yNiAwLC0xMy44OCAtMzUuNjYsLTYuMTEgLTM1LjUzLC0zMC41NiAwLC0xMy43NSAxMS45NywtMTkuNjEgMjQuOTYsLTE5LjYxIDguNTMsMCAxNy41NywyLjU1IDIzLjY4LDYuODggeiBtIDU1LjY4LDUzLjIzIGMgLTQuODQsNS45OSAtMTIuNjEsOC45MSAtMjIuNDEsOC45MSAtMTQuNjQsMCAtMjMuODEsLTkuMDQgLTIzLjgxLC0yMS4wMSAwLC0xMi4zNSA5LjMsLTIwLjI1IDI1LjYsLTIwLjM3IGggMjAuNSBWIDc2LjggYyAwLC04LjUzIC01LjQ4LC0xMy42MyAtMTYuMTcsLTEzLjYzIC02LjQ5LDAgLTEzLjI0LDIuMjkgLTE5Ljk5LDYuODggbCAtNS45OCwtMTAuMTkgYyA5LjQyLC01LjYgMTYuMywtOC41MyAyOS4xNiwtOC41MyAxNy40NSwwIDI3LjI1LDguOTEgMjcuMzgsMjMuODEgbCAwLjEzLDQ0LjQ0IEggMjc3LjQgdiAtOC4yNyB6IG0gLTAuMTMsLTE1LjU0IHYgLTYuMjQgaCAtMTguMzQgYyAtOS41NSwwIC0xNC4wMSwyLjU1IC0xNC4wMSw5LjA0IDAsNi4xMSA0Ljk3LDEwLjA2IDEzLjEyLDEwLjA2IDEwLjQ1LDAgMTguNDcsLTUuNDcgMTkuMjMsLTEyLjg2IHogbSA3Mi4xMywxNS41NCBjIC00Ljg0LDUuOTkgLTEyLjYxLDguOTEgLTIyLjQxLDguOTEgLTE0LjY0LDAgLTIzLjgxLC05LjA0IC0yMy44MSwtMjEuMDEgMCwtMTIuMzUgOS4zLC0yMC4yNSAyNS42LC0yMC4zNyBoIDIwLjUgViA3Ni44IGMgMCwtOC41MyAtNS40OCwtMTMuNjMgLTE2LjE3LC0xMy42MyAtNi40OSwwIC0xMy4yNCwyLjI5IC0xOS45OSw2Ljg4IGwgLTUuOTgsLTEwLjE5IGMgOS40MiwtNS42IDE2LjMsLTguNTMgMjkuMTYsLTguNTMgMTcuNDUsMCAyNy4yNSw4LjkxIDI3LjM4LDIzLjgxIGwgMC4xMyw0NC40NCBIIDM0OS40IHYgLTguMjcgeiBtIC0wLjEyLC0xNS41NCB2IC02LjI0IGggLTE4LjM0IGMgLTkuNTUsMCAtMTQuMDEsMi41NSAtMTQuMDEsOS4wNCAwLDYuMTEgNC45NywxMC4wNiAxMy4xMiwxMC4wNiAxMC40NCwwIDE4LjQ2LC01LjQ3IDE5LjIzLC0xMi44NiB6IG0gNzYuMzMsLTM3LjY5IC01LjM1LDEwLjgyIGMgLTUuOTksLTMuNjkgLTEzLjUsLTUuOTkgLTE5LjQ4LC01Ljk5IC01LjczLDAgLTkuOTMsMS45MSAtOS45Myw2Ljc1IDAsMTIuNDggMzYuMDQsNS43MyAzNS45MSwzMC4zMSAwLDEzLjg4IC0xMi4zNSwyMC4xMiAtMjUuOTgsMjAuMTIgLTkuOTMsMCAtMjAuNSwtMy4zMSAtMjcuMjUsLTkuNDIgbCA1LjIyLC0xMC40NCBjIDUuODYsNS4yMiAxNS4yOCw4LjQgMjIuNjcsOC40IDYuMjQsMCAxMS4wOCwtMi4xNyAxMS4wOCwtNy4yNiAwLC0xMy44OCAtMzUuNjYsLTYuMTEgLTM1LjUzLC0zMC41NiAwLC0xMy43NSAxMS45NywtMTkuNjEgMjQuOTYsLTE5LjYxIDguNTMsMCAxNy41NywyLjU1IDIzLjY4LDYuODggeiIKICAgICAgIGlkPSJwYXRoMzIwIgogICAgICAgc29kaXBvZGk6bm9kZXR5cGVzPSJjY3NzY3NjY3NzY3NjY3NzY2Nzc2Njc2NjY2NjY2Nzc3NjY3NzY2Nzc2Njc2NjY2NjY2Nzc3NjY2Nzc2NzY2Nzc2NzYyIgLz48cGF0aAogICAgICAgZD0ibSA0NTUuMzAyOTgsMTIxLjU2MzY0IGMgLTMuOTY4LDAgLTcuNjgsLTAuODMyIC0xMS4xMzYsLTIuNDk2IC0zLjQ1NiwtMS42NjQgLTYuMjcyLC00LjA2NCAtOC40NDgsLTcuMiBsIDUuNTY4LC02LjUyOCBjIDEuODU2LDIuNTYgMy45MzYsNC41NDQgNi4yNCw1Ljk1MiAyLjM2OCwxLjM0NCA0Ljk2LDIuMDE2IDcuNzc2LDIuMDE2IDcuNjgsMCAxMS41MiwtNC41NDQgMTEuNTIsLTEzLjYzMjAwMSB2IC0zNy43MjggaCAwLjAwNiB2IC04LjM1MiBoIDkuNDk4MDcgdiA0NS42IGMgMCw3LjQ4ODAwMSAtMS43OTIsMTMuMDg4MDAxIC01LjM3NiwxNi44MDAwMDEgLTMuNTIsMy43MTIgLTguNzM2LDUuNTY4IC0xNS42NDgsNS41NjggeiIKICAgICAgIHN0eWxlPSJmb250LXdlaWdodDo1MDA7Zm9udC1zaXplOjk2cHg7Zm9udC1mYW1pbHk6TW9udHNlcnJhdDstaW5rc2NhcGUtZm9udC1zcGVjaWZpY2F0aW9uOidNb250c2VycmF0IE1lZGl1bSc7ZmlsbDojZmZmIgogICAgICAgaWQ9InBhdGg4NjMiCiAgICAgICBzb2RpcG9kaTpub2RldHlwZXM9InNzY2Njc3NjY2Njc2NzcyIgLz48cGF0aAogICAgICAgZD0ibSA1MTEuNDk0ODQsMTIxLjU2MzY0IHEgLTcuNjgsMCAtMTQuNjg4LC0yLjMwNCAtNy4wMDgsLTIuNCAtMTEuMDQsLTYuMTQ0IGwgMy41NTIsLTcuNDg4IHEgMy44NCwzLjM2IDkuNzkyLDUuNTY4IDUuOTUyLDIuMjA4IDEyLjM4NCwyLjIwOCA1Ljg1NiwwIDkuNTA0LC0xLjM0NCAzLjY0OCwtMS4zNDQgNS4zNzYsLTMuNjQ4IDEuNzI4LC0yLjQgMS43MjgsLTUuMzc2IDAsLTMuNDU2MDAxIC0yLjMwNCwtNS41NjgwMDEgLTIuMjA4LC0yLjExMiAtNS44NTYsLTMuMzYgLTMuNTUyLC0xLjM0NCAtNy44NzIsLTIuMzA0IC00LjMyLC0wLjk2IC04LjczNiwtMi4yMDggLTQuMzIsLTEuMzQ0IC03Ljk2OCwtMy4zNiAtMy41NTIsLTIuMDE2IC01Ljc2LC01LjM3NiAtMi4yMDgsLTMuNDU2IC0yLjIwOCwtOC44MzIgMCwtNS4xODQgMi42ODgsLTkuNTA0IDIuNzg0LC00LjQxNiA4LjQ0OCwtNy4wMDggNS43NiwtMi42ODggMTQuNTkyLC0yLjY4OCA1Ljg1NiwwIDExLjYxNiwxLjUzNiA1Ljc2LDEuNTM2IDkuOTg0LDQuNDE2IGwgLTMuMTY4LDcuNjggcSAtNC4zMiwtMi44OCAtOS4xMiwtNC4xMjggLTQuOCwtMS4zNDQgLTkuMzEyLC0xLjM0NCAtNS42NjQsMCAtOS4zMTIsMS40NCAtMy42NDgsMS40NCAtNS4zNzYsMy44NCAtMS42MzIsMi40IC0xLjYzMiw1LjM3NiAwLDMuNTUyIDIuMjA4LDUuNjY0IDIuMzA0LDIuMTEyIDUuODU2LDMuMzYgMy42NDgsMS4yNDggNy45NjgsMi4zMDQgNC4zMiwwLjk2IDguNjQsMi4yMDggNC40MTYsMS4yNDggNy45NjgsMy4yNjQgMy42NDgsMi4wMTYgNS44NTYsNS4zNzYgMi4yMDgsMy4zNiAyLjIwOCw4LjY0MDAwMSAwLDUuMDg4IC0yLjc4NCw5LjUwNCAtMi43ODQsNC4zMiAtOC42NCw3LjAwOCAtNS43NiwyLjU5MiAtMTQuNTkyLDIuNTkyIHoiCiAgICAgICBzdHlsZT0iZm9udC13ZWlnaHQ6NTAwO2ZvbnQtc2l6ZTo5NnB4O2ZvbnQtZmFtaWx5Ok1vbnRzZXJyYXQ7LWlua3NjYXBlLWZvbnQtc3BlY2lmaWNhdGlvbjonTW9udHNlcnJhdCBNZWRpdW0nO2ZpbGw6I2ZmZiIKICAgICAgIGlkPSJwYXRoODY1IiAvPjwvZz48L3N2Zz4K"
              style={{ margin: '0 30px' }}
              width="200"
            />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 60,
              fontStyle: 'normal',

              letterSpacing: '-0.025em',
              marginTop: 40,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              textAlign: 'center',
              position: 'absolute',
              left: '200px',
              right: '200px',
              zIndex: 10,
            }}
          >
            <div
              style={{
                fontFamily: 'InterBold',
                fontWeight: 500,
                color: 'white',
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {title}
            </div>

            {description && (
              <div
                style={{
                  fontFamily: 'Inter',
                  display: 'flex',
                  fontSize: 30,
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                {description}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'InterBold',
            data: fontDataBold,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    )
  } catch (e: any) {
    console.log(`${e.message}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
