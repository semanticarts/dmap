const readline = require('readline');

const express = require('express');
const { DataFactory, Store } = require('n3');
const { namedNode, literal, quad } = DataFactory;
const axios = require('axios');

const store = new Store();

let id_counter = 0;

const class_map = {
  "https://ontologies.semanticarts.com/dmap/Node": 'n',
  "https://ontologies.semanticarts.com/dmap/Issue": 'i',
  'https://ontologies.semanticarts.com/dmap/Argument': 'a',
  'https://ontologies.semanticarts.com/dmap/Position': 'p'
}

const relationship_map = {
  'objectsTo': namedNode('https://ontologies.semanticarts.com/dmap/objectsTo'),
  'questions': namedNode('https://ontologies.semanticarts.com/dmap/questions'),
  'suggestedBy': namedNode('https://ontologies.semanticarts.com/dmap/suggestedBy'),
  'generalizes': namedNode('https://ontologies.semanticarts.com/dmap/generalizes'),
  'specializes': namedNode('https://ontologies.semanticarts.com/dmap/specializes'),
  'respondsTo': namedNode('https://ontologies.semanticarts.com/dmap/respondsTo'),
  'supports': namedNode('https://ontologies.semanticarts.com/dmap/supports'),
  'replaces': namedNode('https://ontologies.semanticarts.com/dmap/replaces'),
}

const relationship_options = new Set(['objectsTo', 'suggestedBy', 'questions', 'generalizes', 'specializes', 'respondsTo',])
const valid_options = new Set(['issue', 'position', 'argument', 'node', 'replaces', 'supports', 'delete', 'restore', 'list'].concat(relationship_options))
const id_regex_string = '^[' + Object.values(class_map).join('') + '0-9][0-9]*$';
const id_regex = new RegExp(id_regex_string);

/**
 * 
 * @param {String} id - e.g. 'n1' 
 */
function get_subject_from_id(id) {
  // Get the number from the id, optionally has a letter prefix
  const id_number = id.match(/\d+/)[0];
  const class_prefix_result = id.match(/\D+/);
  const class_prefix = class_prefix_result ? class_prefix_result[0] : null;
  // Search for subject based on it's `dmap:id` value matching 'id_number'
  const subject = store.getSubjects(namedNode("https://ontologies.semanticarts.com/dmap/id"), literal(id_number, namedNode("http://www.w3.org/2001/XMLSchema#integer")), null)[0];
  // Validate that the subject 
  const _class = store.getQuads(subject, namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), null, null)[0].object.value;
  if (class_prefix && class_map[_class] !== class_prefix) {
    throw new Error(`Invalid id '${id}'`);
  }
  return subject;
}

/**
 * 
 * @param {string} value 
 * @param {Set} from 
 * @returns {list} - All possible values from 'from' that start with 'value'
 */
function get_possible_value(value, from) {
  const possible_values = [];
  for (const item of from) {
    if (item.startsWith(value)) {
      possible_values.push(item);
    }
  }
  return possible_values;
}

// Create Express app
const app = express();
app.use(express.text());

// POST route to add an RDF instance
app.post('/api/add', (req, res) => {
  // TODO: add the new instance to the store
  // Use DataFactory to create the necessary triples and add them to the store
  // You would get the information you need to create the triples from the request body

  const type = req.query.type || 'node'; // If no 'type' is specified, default to 'node'
  // Parse body as variable 'text'
  const text = req.body;

  let rdfClass;

  switch (type.toLowerCase()) {
    case 'node':
      rdfClass = namedNode("https://ontologies.semanticarts.com/dmap/Node");
      break;
    case 'issue':
      rdfClass = namedNode("https://ontologies.semanticarts.com/dmap/Issue");
      break;
    case 'argument':
      rdfClass = namedNode("https://ontologies.semanticarts.com/dmap/Argument");
      break;
    case 'position':
      rdfClass = namedNode("https://ontologies.semanticarts.com/dmap/Position");
      break;
    default:
      return res.status(400).send('Invalid \'?type\' query parameter');
  }
  // Increment the id_counter and use it to create a new namedNode
  id_counter++;
  const instance_id = id_counter;
  const subject = namedNode(`https://ontologies.semanticarts.com/dmap/_node${instance_id}`);

  store.addQuad(quad(subject, namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), rdfClass));
  store.addQuad(quad(subject, namedNode("https://ontologies.semanticarts.com/dmap/id"), literal(instance_id, namedNode("http://www.w3.org/2001/XMLSchema#integer"))));
  store.addQuad(quad(subject, namedNode("https://ontologies.semanticarts.com/dmap/text"), literal(text)));

  res.json({
    id: instance_id,
    text: text,
    instance: subject.value
  });
});

// PUT route to update an RDF instance
app.put('/api/update', (req, res) => {
  // TODO: update the instance in the store
  // You would need to find the existing triples related to the instance and replace them with the updated triples
  const instance_id = req.query.id;
  const text = req.body.text;

  const subject = namedNode(`https://ontologies.semanticarts.com/dmap/_node${instance_id}`);
  const original_text_obj = store.getQuads(subject, namedNode("https://ontologies.semanticarts.com/dmap/text"), null, null)[0].object;

  store.addQuad(quad(subject, namedNode("https://ontologies.semanticarts.com/dmap/text"), literal(text, namedNode("http://www.w3.org/2001/XMLSchema#string"))));
  store.removeQuad(quad(subject, namedNode("https://ontologies.semanticarts.com/dmap/text"), original_text_obj));

  res.json({
    id: instance_id,
    original_text: original_text_obj.value,
    text: text,
    instance: subject.value
  });
});

// POST route to connect one instance to another
app.post('/api/connect', (req, res) => {
  // Get list of all 'from' instances and all 'to' instances in the request query params
  let _from = req.query.from;
  let _to = req.query.to;
  const relationship = req.query.relationship;

  // If 'relationship' not in 'relationship_map', return 400
  if (!relationship_map[relationship]) {
    return res.status(400).send(`Invalid '?relationship' query parameter: ${relationship}`);
  }

  if (typeof _from == 'string') {
    _from = [_from];
  }
  console.log(_from)
  if (typeof _to == 'string') {
    _to = [_to];
  }

  // Get the subject for each '_from' instance
  const from_subjects = _from.map((id) => get_subject_from_id(id));
  // Get the subject for each '_to' instance
  const to_subjects = _to.map((id) => get_subject_from_id(id));

  // Iterate over 'from' subjects
  for (const from_subject of from_subjects) {
    // Iterate over 'to' subjects
    for (const to_subject of to_subjects) {
      // Add a triple for each 'from' and 'to' subject
      store.addQuad(quad(from_subject, relationship_map[relationship], to_subject));
    }
  }

  return res.json({
    from: _from,
    to: _to,
    relationship: relationship
  });

});

// POST route to list all nodes
app.get('/api/list-all', (req, res) => {
  let list_message = '';
  // Iterate over and print all subjects in the store with their ID and text
  store.getSubjects(null, null, null).forEach((subject) => {
    const _class = store.getQuads(subject, namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"), null, null)[0].object.value;
    const id = store.getQuads(subject, namedNode("https://ontologies.semanticarts.com/dmap/id"), null, null)[0].object.value;
    const text = store.getQuads(subject, namedNode("https://ontologies.semanticarts.com/dmap/text"), null, null)[0].object.value;

    list_message += `${class_map[_class]}${id} "${text}"\n`;

  });

  res.send(list_message);
});

// Initialize a server
const server = app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', async (input) => {
  const command = input.split(' ');
  const options_specified = set();
  const nodes_specified = set();
  const relationship_specified = null;
  const relationship_from = set();
  const relationship_to = set();
  let text = '';


  // Iterate over 'command' and add the options and nodes to their respective sets
  for (let i = 0; i < command.length; i++) {
    if (command[i].startsWith('--')) {
      // Validate whether 'command' is a node (e.g. --i1)
      // Validate with regular expression where first char can be 
      // 'valid_class_acronyms' or a number, and subsequent chars are numbers.
      if (id_regex.test(command[i].slice(2))) {
        nodes_specified.add(command[i].slice(2));
        if (relationship_specified != null) {
          relationship_to.add(command[i].slice(2))
        }
        continue;
      }

      const possible_values = get_possible_value(command[i].slice(2), valid_options);
      if (possible_values.length == 0) {
        console.log(`[WARNING] Invalid option: ${command[i]}`);
      } else if (possible_values.length == 1) {
        options_specified.add(possible_values[0]);
      } else {
        console.log(`[WARNING] Ambiguous option: ${command[i]} can be ${possible_values.map(x => `--${x}`).join(', ')}`);
      }

      if (relationship_options.has(possible_values[0])) {
        if (relationship_specified != null) {
          console.log(`[WARNING] Multiple relationship options specified: ${relationship_specified}, ${possible_values[0]}, ...`);
          continue;
        }
        relationship_specified = possible_values[0];
        // Add all nodes in 'nodes_specified' to 'relationship_from'
        for (const node of nodes_specified) {
          relationship_from.add(node);
        }
      }

      continue;
    }

    // Add the word to the 'text' variable
    text += command[i] + ' ';
  }
  // Remove trailing whitespace
  text = text.trim();

  if (relationship_specified != null) {
    if (relationship_from.length > 0 && text != '') {
      console.log("[ERROR] Relationship specified with existing nodes and new text. Please specify either existing nodes or new text, not both.")
      return;
    }
    if (relationship_from.length > 0) {
      const response = await axios.get('http://localhost:3000/api/connect');

    } else {

    }
    return;
  }

  if (options_specified.has('list')) {
    const response = await axios.get('http://localhost:3000/api/list-all');
    console.log(response.data)
  }

  console.log(`Received: ${input}`);

  // Handle 'exit' command
  if (input === 'exit') {
    rl.close();
    server.close(() => {
      console.log('Server closed');
    });
  }
});