export const baselineStore = [
    {
        id : 'DA0524CF-3073-4346-ACDA-F5816650FE8A',        
        pathnames : [
            {
                pathname : '/',
                baseline : {
                    performance : 0.9,
                    seo : 0.9
                }
            },
            {
                pathname : '/c/docs/getting-started',
                baseline : {
                    performance : 0.75,
                    seo : 0.8,
                    accessibility : undefined,
                    'best-practices' : undefined
                }
            },
            {
                pathname : '/c/docs/developers',
                baseline : {
                    performance : 0.75,
                    seo : 0.8
                }
            }
        ]
    }
]

export const configStore = [
    {
        id : 'DA0524CF-3073-4346-ACDA-F5816650FE8A',
        defaultBaseUrl : 'https://www.builder.io',
        pathnames : ['/', '/c/docs/getting-started', '/c/docs/developers'],
        alert : {
            email: 'akshat@builder.io',
        }
    }
]

