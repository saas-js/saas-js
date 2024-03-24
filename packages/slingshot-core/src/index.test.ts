import { createSlingshot } from ".";

import { handle } from '@saas-js/slingshot-lambda';

import s3 from '@saas-js/slingshot/s3'

const app = createSlingshot({
    profile: 'avatar',
    maxSize: 1024,
    allowedFileTypes: ['image/png', 'image/jpeg'],
    key: ({ file }) => `avatar/${file.name}`,
    adapter: s3({
        region: 'us-west-2',
        bucket: 'slingshot',
    })
})

//app.use(authorize)

export const handler = handle(app)
