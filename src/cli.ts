import { readFileSync, writeFileSync } from 'node:fs'
import { parseSvg, toSvg } from './index.js'

function printHelp(): void {
  console.log(`pattapatta — pen-plotter geometry CLI

Usage:
  pattapatta --help
  pattapatta --version
  pattapatta svg:roundtrip <input.svg> [output.svg]

Commands:
  svg:roundtrip   Parse SVG and write plotter SVG (fill=none, stroked paths)
`)
}

function main(argv: string[]): void {
  const args = argv.slice(2)
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp()
    return
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log('0.1.0')
    return
  }

  const [cmd, input, output] = args
  if (cmd === 'svg:roundtrip') {
    if (!input) {
      console.error('Missing input.svg')
      process.exitCode = 1
      return
    }
    const svg = readFileSync(input, 'utf8')
    const group = parseSvg(svg)
    const out = toSvg(group)
    if (output) {
      writeFileSync(output, out, 'utf8')
    } else {
      process.stdout.write(out)
      if (!out.endsWith('\n')) process.stdout.write('\n')
    }
    return
  }

  console.error(`Unknown command: ${cmd}`)
  printHelp()
  process.exitCode = 1
}

main(process.argv)
