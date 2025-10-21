#!/usr/bin/env python3
import json, sys
from jsonschema import validate, exceptions

with open('schema.json', 'r') as f:
    schema = json.load(f)

filename = sys.argv[1] if len(sys.argv) > 1 else 'courses-structure-extended.json'
with open(filename, 'r') as f:
    data = json.load(f)

try:
    validate(instance=data, schema=schema)
    print('✅ File valido secondo schema.')
except exceptions.ValidationError as e:
    print(f'❌ Errore di validazione: {e.message} (path: {list(e.path)})')

