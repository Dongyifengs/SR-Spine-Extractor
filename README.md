# SR-Spine-Extractor
# Current README is a temporary version and the official version is not yet released.

[![License: GPL-3.0](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[中文文档](https://github.com/Dongyifengs/SR-Spine-Extractor/blob/main/README_cn.md)

## Project Description

`SR-Spine-Extractor` is a tool designed to extract content related to the Spine project from the specialized showcase pages of **Honkai: Star Rail**. It can directly extract relevant Spine project files (such as `.atlas`, `.png`, `.skel`, `.json`) and use an installed genuine Spine software to automatically bundle these files into `.spine` files. Additionally, the tool supports saving all elements from a user-provided webpage URL, including `mp3`, `mp4`, `js`, and any other resources present on the webpage.

## Features

- **Extract Spine Project Files**: Automatically extracts `.atlas`, `.png`, `.skel`, `.json`, and other related files.
- **Automatically Bundle into `.spine` Files**: Requires genuine Spine software to bundle the extracted files into `.spine` files.
- **Save All Webpage Elements**: Supports saving all elements from a specified webpage URL, including multimedia files and scripts.
- **Open Collaboration**: Licensed under GPL-3.0, welcoming community contributions, feedback on issues, and suggestions for improvements.

## Project Repository

[GitHub Repository](https://github.com/Dongyifengs/SR-Spine-Extractor/)

## Installation and Usage

### Prerequisites

- Install [Bun](https://bun.sh/) as the runtime environment.
- If you need to automatically bundle `.spine` files, install the genuine [Spine](http://esotericsoftware.com/) software.

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/Dongyifengs/SR-Spine-Extractor.git
   ```

2. Navigate to the project directory:

   ```bash
   cd SR-Spine-Extractor
   ```

3. Install dependencies:

   ```bash
   bun install
   ```

### Usage

Run the main program and provide the target webpage URL:

```bash
bun run main.js <webpage_url>
```

For example:

```bash
bun run main.js https://example.com/page
```

The tool will automatically extract the relevant files and, if configured, bundle them into `.spine` files.

## Contributing

We welcome everyone to develop and enhance this project! Please follow these steps to contribute:

1. Fork this repository.
2. Create your feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Create a new Pull Request.

For more details, please refer to the [Contributing Guide](CONTRIBUTING.md).

## License

This project is licensed under the [GPL-3.0 License](https://www.gnu.org/licenses/gpl-3.0.en.html).

## Acknowledgements

- Special thanks to [JetBrains](https://www.jetbrains.com/) for providing development tools support.

## Contact

If you have any questions, feedback, or infringement claims, please contact us via the following emails:

- `1545929126@qq.com`
- `dongyifengs@gmail.com`

**Note**: This project is intended for personal learning and reference only. Commercial use is prohibited. If there is any infringement, please contact us for removal.