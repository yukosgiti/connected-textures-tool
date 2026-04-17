import manifest from '../lib/connected-texture-templates.json' with { type: 'json' };

const templates = [...manifest.templates].sort((left, right) => left.index - right.index);

function templateRequirements(template) {
  const layerSet = new Set(template.layers);

  const top = !layerSet.has('side_top');
  const right = !layerSet.has('side_rt');
  const bottom = !layerSet.has('side_btm');
  const left = !layerSet.has('side_lt');

  return {
    top,
    right,
    bottom,
    left,
    topLeft: top && left ? !layerSet.has('crn_out_top_lt') : null,
    topRight: top && right ? !layerSet.has('crn_out_top_rt') : null,
    bottomLeft: bottom && left ? !layerSet.has('crn_out_btm_lt') : null,
    bottomRight: bottom && right ? !layerSet.has('crn_out_btm_rt') : null,
  };
}

const requirementsByIndex = new Map(
  templates.map((template) => [template.index, templateRequirements(template)]),
);

function neighborValue(cells, row, column, size) {
  if (row < 0 || row >= size || column < 0 || column >= size) {
    return false;
  }

  return cells[row][column];
}

function evaluateTemplateIndex(cellValues, size, row, column) {
  if (!neighborValue(cellValues, row, column, size)) {
    return null;
  }

  const neighbors = {
    top: neighborValue(cellValues, row - 1, column, size),
    right: neighborValue(cellValues, row, column + 1, size),
    bottom: neighborValue(cellValues, row + 1, column, size),
    left: neighborValue(cellValues, row, column - 1, size),
    topLeft: neighborValue(cellValues, row - 1, column - 1, size),
    topRight: neighborValue(cellValues, row - 1, column + 1, size),
    bottomLeft: neighborValue(cellValues, row + 1, column - 1, size),
    bottomRight: neighborValue(cellValues, row + 1, column + 1, size),
  };

  for (const template of templates) {
    const required = requirementsByIndex.get(template.index);

    if (
      neighbors.top !== required.top ||
      neighbors.right !== required.right ||
      neighbors.bottom !== required.bottom ||
      neighbors.left !== required.left
    ) {
      continue;
    }

    if (required.topLeft !== null && neighbors.topLeft !== required.topLeft) {
      continue;
    }

    if (required.topRight !== null && neighbors.topRight !== required.topRight) {
      continue;
    }

    if (required.bottomLeft !== null && neighbors.bottomLeft !== required.bottomLeft) {
      continue;
    }

    if (required.bottomRight !== null && neighbors.bottomRight !== required.bottomRight) {
      continue;
    }

    return template.index;
  }

  return null;
}

function centerPositionsForSize(size, stride = 3) {
  const positions = [];

  for (let position = 1; position < size - 1; position += stride) {
    positions.push(position);
  }

  return positions;
}

function setCell(grid, row, column, value) {
  const previous = grid[row][column];
  if (previous !== null && previous !== value) {
    throw new Error(`Conflicting cell assignment at ${row},${column}`);
  }

  grid[row][column] = value;
}

function buildPackedGrid(size) {
  const centers = centerPositionsForSize(size);
  const capacity = centers.length * centers.length;

  if (capacity < templates.length) {
    throw new Error(`Grid ${size}x${size} can only host ${capacity} isolated neighborhoods`);
  }

  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
  const placements = [];

  templates.forEach((template, slotIndex) => {
    const centerRow = centers[Math.floor(slotIndex / centers.length)];
    const centerColumn = centers[slotIndex % centers.length];
    const required = requirementsByIndex.get(template.index);

    setCell(grid, centerRow, centerColumn, true);
    setCell(grid, centerRow - 1, centerColumn, required.top);
    setCell(grid, centerRow, centerColumn + 1, required.right);
    setCell(grid, centerRow + 1, centerColumn, required.bottom);
    setCell(grid, centerRow, centerColumn - 1, required.left);
    setCell(grid, centerRow - 1, centerColumn - 1, required.topLeft ?? false);
    setCell(grid, centerRow - 1, centerColumn + 1, required.topRight ?? false);
    setCell(grid, centerRow + 1, centerColumn - 1, required.bottomLeft ?? false);
    setCell(grid, centerRow + 1, centerColumn + 1, required.bottomRight ?? false);

    placements.push({
      templateIndex: template.index,
      centerRow,
      centerColumn,
    });
  });

  return {
    values: grid.map((row) => row.map((cell) => cell ?? false)),
    centersPerSide: centers.length,
    placements,
  };
}

function collectCoverage(values) {
  const coveredTemplates = [];

  for (let row = 0; row < values.length; row += 1) {
    for (let column = 0; column < values.length; column += 1) {
      const templateIndex = evaluateTemplateIndex(values, values.length, row, column);
      if (templateIndex !== null) {
        coveredTemplates.push({ row, column, templateIndex });
      }
    }
  }

  return coveredTemplates;
}

function buildSolution(size) {
  const { values, centersPerSide, placements } = buildPackedGrid(size);
  const coveredTemplates = collectCoverage(values);
  const coveredSet = new Set(coveredTemplates.map((entry) => entry.templateIndex));
  const missing = templates
    .map((template) => template.index)
    .filter((templateIndex) => !coveredSet.has(templateIndex));

  if (missing.length > 0) {
    throw new Error(`Constructed grid is missing templates: ${missing.join(', ')}`);
  }

  const cells = values.flat();

  return {
    size,
    centersPerSide,
    selectedCellCount: cells.filter(Boolean).length,
    rows: values.map((row) => row.map((cell) => (cell ? '1' : '0')).join('')),
    cells,
    placements,
    coveredTemplates,
  };
}

const size = Number(process.argv[2] ?? 21);
console.log(JSON.stringify(buildSolution(size), null, 2));
