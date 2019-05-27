const fs = require('fs')
const neatCsv = require('neat-csv')
const commandLineArgs = require('command-line-args')
const { DateTime, Duration, Interval } = require('luxon')

const optionDefinitions = [
    { name: 'data', type: String },
    { name: 'maxHours', type: Number },
]

async function run() {
    const options = commandLineArgs(optionDefinitions);
    const hours = await neatCsv(fs.createReadStream(options.data));

    const maxDuration = Duration.fromObject({ hours: options.maxHours })

    const dateMap = new Map();

    hours.forEach((entry) => {
        let duration = dateMap.get(entry.Datum);

        const add = Interval.fromDateTimes(
            DateTime.fromFormat(`${entry.Datum} ${entry.Beginn}`, 'yyyy-MM-d HH:mm'),
            DateTime.fromFormat(`${entry.Datum} ${entry.Ende}`, 'yyyy-MM-d HH:mm')
        ).toDuration()

        if (duration) {
            duration = duration.plus(add)
        } else {
            duration = add
        }

        dateMap.set(entry.Datum, duration);
    })

    const weekMap = new Map();
    let lastWeek = 0;
    let currentWeek = 0;
    for (let [key, value] of dateMap.entries()) {
        const date = DateTime.fromFormat(key, 'yyyy-MM-d')

        if (currentWeek != date.weekNumber) {
            currentWeek = date.weekNumber

            if (lastWeek != 0) {
                const sumLastWeek = weekMap.get(lastWeek)

                console.log(`Total: ${sumLastWeek.toFormat('hh:mm')}`)
                console.log(`Left: ${maxDuration.minus(sumLastWeek).toFormat('h:m')}`)
                lastWeek = currentWeek
            } else {
                lastWeek = date.weekNumber
            }

            console.log(`---\nWeek: ${currentWeek}\n---`)
        }

        console.log(`${date.toFormat("dd.MM")}: ${value.toFormat("hh:mm")}`)

        let weekTime = weekMap.get(currentWeek)

        if (weekTime) {
            weekTime = weekTime.plus(value)
        } else {
            weekTime = value
        }

        weekMap.set(date.weekNumber, weekTime)
    }

    const sumLastWeek = weekMap.get(lastWeek)

    console.log(`Total: ${sumLastWeek.toFormat('hh:mm')}`)
    console.log(`Left: ${maxDuration.minus(sumLastWeek).toFormat('hh:mm')}`)
}

run()