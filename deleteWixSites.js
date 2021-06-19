async function moveToTrash(metaSiteId, siteDetails, headers) {
    let response
    try {
        response = await fetch(`https://manage.wix.com/_api/my-account-services/sites/${metaSiteId}/move-to-trash`, {
            method: 'POST',
            headers
        })
        if (response.ok) {
            console.log(`%cDeleted site ${siteDetails} successfully`, 'color: cyan')
            return
        }
        throw new Error()
    } catch(e) {
        console.log(`%cFailed to delete site ${siteDetails}  (${response.status}  ${response.statusText})`, 'color: orange')
    }
}

async function getSiteList(searchTerm, headers) {
    const result = await fetch(`https://manage.wix.com/account/sites/api/sites/search?query=${searchTerm}`, {
        mode: 'no-cors',
        headers
    })
    const json = await result.json()
    return json.sites
}

function deleteWixSites({searchTerm, dryRun, max, dir, xsrf}) {
    if (!searchTerm?.length || ![true, false].includes(dryRun) || !Number.isInteger(max) || !['F', 'B'].includes(dir) || !xsrf) {
        console.log('Required parameters:')
        console.log('     searchTerm: site name search term')
        console.log('     dryRun: true/false')
        console.log('     max:    maximum number of deletions')
        console.log('     dir:    F/B (F = delete oldest to newest, B = delete newest to oldest)')
        console.log('     xsrf:   XSRF token')
        return
    }
    const headers = {
        'X-XSRF-TOKEN': xsrf
    }
    getSiteList(searchTerm, headers).then(async sites => {
        sites.sort((a, b) => dir === 'F' ? a.dateCreated - b.dateCreated : b.dateCreated - a.dateCreated)
        console.log(`%c${sites.length} sites were found for deletion`, 'color: lime; font-size: 1.2em')
        let promise = Promise.resolve()
        for (const {metaSiteId, name, editorType, dateCreated, ownerEmail} of sites) {
            if (max-- === 0) {
                break
            }
            const siteDetails = `"${name}"   owner: ${ownerEmail}   type: ${editorType}   created: ${new Date(dateCreated).toDateString()}`
            if (dryRun) {
                console.log(siteDetails)
            } else {
                promise = promise.then(() => moveToTrash(metaSiteId, siteDetails, headers))
            }
        }
        await promise
        console.log('%cCompleted!', 'color: lime; font-size: 1.2em')
    })
}

deleteWixSites({searchTerm: 'my', dryRun: true, max: 20, dir: 'B', xsrf: ''})
