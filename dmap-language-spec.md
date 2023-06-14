Dialog Mapping Tool - Command Language
======================================

Contents
========

*   [Contents](#DialogMappingTool-CommandLanguage-Conte)
*   [Introduction](#DialogMappingTool-CommandLanguage-Intro)
*   [To Do](#DialogMappingTool-CommandLanguage-ToDo)
*   [Language Design Objectives](#DialogMappingTool-CommandLanguage-Langu)
*   [Example](#DialogMappingTool-CommandLanguage-Examp)

*   [Example Command Session](#DialogMappingTool-CommandLanguage-Examp)
*   [Example Graphic Output](#DialogMappingTool-CommandLanguage-Examp)

*   [General Definitions](#DialogMappingTool-CommandLanguage-Gener)
*   [IBIS Diagram](#DialogMappingTool-CommandLanguage-IBISD)
*   [Coloring Conventions](#DialogMappingTool-CommandLanguage-Color)

*   [Node Coloring](#DialogMappingTool-CommandLanguage-NodeC)
*   [Link Coloring](#DialogMappingTool-CommandLanguage-LinkC)

*   [Command Line Parsing](#DialogMappingTool-CommandLanguage-Comma)

*   [Command Line Parsing Definitions](#DialogMappingTool-CommandLanguage-Comma)
*   [Command Line Parsing Algorithm](#DialogMappingTool-CommandLanguage-Comma)

*   [Command Patterns](#DialogMappingTool-CommandLanguage-Comma)

*   [Command Patterns that expect text](#DialogMappingTool-CommandLanguage-Comma)
*   [Command Patterns that do not expect text](#DialogMappingTool-CommandLanguage-Comma)
*   [Mapped Command Patterns](#DialogMappingTool-CommandLanguage-Mappe)

*   [List Command](#DialogMappingTool-CommandLanguage-ListC)

*   [Listing Format](#DialogMappingTool-CommandLanguage-Listi)

*   [Node Listing Format](#DialogMappingTool-CommandLanguage-NodeL)
*   [Link Listing Format](#DialogMappingTool-CommandLanguage-LinkL)

*   [Ontology](#DialogMappingTool-CommandLanguage-Ontol)

*   [Ontology Listing](#DialogMappingTool-CommandLanguage-Ontol)
*   [Ontology Visualization](#DialogMappingTool-CommandLanguage-Ontol)

Introduction
============

This document proposes a command-line language for adding to and maintaining a graph representation of a discussion or dialog. The graph representation would be kept in a triple store, and a separate process would render it visually.

To Do
=====

Add `isAgreed` and `isDeprecated` properties

Add commands to support `isAgreed`

Add `--restore` command to clear `isDeprecated`

Add commands to support `Comment`.

Language Design Objectives
==========================

1.      To support live notetaking:

1.      Minimize error conditions by interpreting commands generously and flexibly

2.      Minimize re-entry by capturing as much as possible of each command line

3.      Minimize backspacing (e.g., by allowing later tokens to override earlier tokens)

2.      Easy to learn

3.      Supports future use as back-end for chatbot

4.      Congruent with IBIS

Example
=======

Example Command Session
-----------------------

\> \--issue What should we order for dinner?

i1:"What should we order for dinner?"

\> pizza --pos –i1

p2:"pizza" --respondsTo i1:"What should we order for dinner?"

\> what should we have on it? --iss --res --p1

i3:"what should we have on it" --respondsTo p2:”pizza”

\> burgers --pos --i1

p4:"burgers" --respondsTo i1:”What should we order for dinner?”

\> \--list

i1:”What should we order for dinner?”

p2:”pizza” --respondsTo i1:”What should we order for dinner?”

i3:”what should we have on it?” --respondsTo p2:”pizza”

p4:”burgers” --respondsTo i1:”What should we order for dinner?”

\> Lucy is lactose-intolerant --obj --2

a5:”Lucy is lactose-intolerant” --objectsTo p2:”pizza”

\> \--obj --p4 We had burgers last week

a6:”We had burgers last week” --objectsTo p4:”burgers”

\> Gio’s has non-dairy pizza --q --a5

i7:”Gio’s has non-dairy pizza” --questions a5:”Lucy is lactose-intolerant”

Example Graphic Output
----------------------

![](Dialog+Mapping+Tool+-+Command+Language.doc_files/image001.png)

General Definitions
===================

1.      Classes

1.      **Issue, Position, and Argument** are defined in IBIS

2.      A **Comment** is either an Issue, Position, or Argument; but it is not yet specified which one

3.      A **Node** is an Issue, Position, Argument, or Comment

2.      Predicates

1.      **generalizes, specializes, replaces, respondsTo, supports, objectsTo, questions,** and \[is\]**suggestedBy** are defined in IBIS.

2.      **commentsOn** relates a Comment to a Node

3.      The **nodeId** is a system-assigned integer that uniquely identifies a Node.

4.      The **nodeCode** is the first letter of the node’s class (issue, position, argument, or comment) followed by the digits of the nodeID. In commands, a nodeCode may be used in place of a nodeID.

IBIS Diagram
============

![](Dialog+Mapping+Tool+-+Command+Language.doc_files/image003.png)

Coloring Conventions
====================

In graphical renderings or in colored text, the following colors should be used:

Node Coloring
-------------

1.      An Issue is colored Blue. If the issue isn’t the subject of any relationship, it is has a thick black border.

2.      A Position is colored Orange. If the Position is “agreed” then it has a thick green border.

3.      An Argument that is the subject of a “supports” link is colored Green

4.      An Argument that is the subject of a “objectsTo” link is colored Red

5.      Any other Node is colored Grey

Link Coloring
-------------

A Link is the color of its subject

Command Line Parsing
====================

Command Line Parsing Definitions
--------------------------------

In the definition of the Command Line Parsing Algorithm:

1.      A **Word** is any sequence of non-white space characters delimited by white space and/or the beginning or end of a line and not inside of single- or double-quotes.

2.      A **Token** is a word beginning with a double hyphen

3.      A **Valid Token** is a word consisting of a double hyphen follow by either

1.      An instantiated nodeId or nodeCode, or

2.      Enough leftmost letters of a command word to unambiguously match that command word.

4.      A **Command** is an ordered collection of valid tokens

5.      A **Valid Command** is a command that matches some “Command Pattern”. The parts of a command can be in any order.

6.      **Command Text** is everything in a Command Line except the valid tokens. \[ToDo: Consider quoted strings. And, what about ignored tokens?\]

Command Line Parsing Algorithm
------------------------------

In a working copy of the command line:

1.      Remove any leading or trailing whitespace, and replace consecutive whitespace characters with single spaces

2.      Mark all Valid Tokens as “edible” and all other Words as “nonedible”.

3.      While there are edible tokens,

1.      While the set of edible tokens is non-empty and does not match a Command Pattern

1.      Mark the leftmost edible token as non-edible

4.      If the set of edible tokens is non-empty,

1.      Execute the matching Command Pattern; otherwise

2.      Execute the command pattern “\[text\] --comment” where \[text\] is the working copy of the command line. \[ToDo: add `--comment` to Command Patterns\]

5.      Write the result. Equivalent to: `--list [n] [m]`, where n is the nodeId of any Node created and m is the nodeId of the object Node in any Link created.

Command Patterns
================

The valid tokens that make up a command pattern may appear in any order, except that the order of node IDs matters. \[Items in square brackets\] are optional.

_To support the design objectives, matching of command patterns is_ **_not_** _case-sensitive._

Command Patterns that expect text
---------------------------------

If no text is supplied, create a node with no label

**Command Pattern**

**Action**

`--issue text`

Create an Issue using _text_

`--position text`

Create a Position using _text_

`--argument text`

Create an Argument using _text_

`--nodeIdA text`

Change the label of NodeA to _text_

`[--issue] text --suggestedBy --nodeIdA`

Create an Issue using _text_, with a “suggestedBy” link to NodeA

`[--issue] text --questions --nodeIdA`

Create an issue using _text_, with a “questions” link to NodeA

`[--issue] text --generalizes --issueIdA`

Create an Issue using _text_, with a “generalizes” link to IssueA

`[--issue] text --specializes --issueIdA`

Create an issue using _text_, with a “specializes” link to IssueA

`[--issue] text --replaces --issueIdA`

Create an Issue using _text_, with a “replaces” link to IssueA

`[--position] text --respondsTo --issueIdA`

Create a Position using _text_, with a “respondsTo” link to IssueA

`[--argument] text --supports --positionIdA`

Create an Argument using _text_, with a “supports” link to PositionA

`[--argument] text --objectsTo --positionIdA`

Create an Argument using _text_, with a “objectsTo” link to PositionA

Command Patterns that do not expect text
----------------------------------------

If text is supplied, then in addition to the listed action create an Issue node using the supplied text. (ToDo: should this be a Comment node?)

**Command Pattern**

**Action**

`[--issue] --issueIdA --generalizes --issueIdB`

Create a “generalizes” link from IssueA to IssueB,  
replacing any existing link where IssueA is the subject and IssueB is the object.

`[--issue] --issueIdA --specializes --issueIdB`

Create a “specializes” link from IssueA to IssueB,  
replacing any existing link where IssueA is the subject and IssueB is the object.

`[--issue] --issueIdB --replaces --issueIdA`

Create a “replaces” link from IssueA to IssueB, replacing any existing link where IssueA is the subject and IssueB is the object.

`[--issue] --issueIdA --suggestedBy --nodeIdB`

Create a “suggestedBy” link from IssueA to NodeB_,_  
replacing any existing link where IssueA is the subject and IssueB is the object.

`[--issue] --issueIdA --questions --nodeIdB`

Create a “questions” link from IssueA to NodeB,  
replacing any existing link where IssueA is the subject and IssueB is the object.

`[--argument] --argumentIdA --supports --positionIdB`

Create a “supports” link from ArgumentA to PostionB, replacing any existing link where IssueA is the subject and IssueB is the object.

`[--argument] --argumentIdA --objectsTo --positionIdB`

Create a “objectsTo” link from ArgumentA to PositionB, replacing any existing link where IssueA is the subject and IssueB is the object.

`--delete --nodeIdA`

Set NodeA.deprecated

`--delete --nodeIdA --nodeIdB`

Delete any link connecting NodeA and NodeB

`--list [--nodeIdA] --[nodeIdB]`

_See “List Command” below_

Mapped Command Patterns
-----------------------

Functionally replace these patterns with the mapped patterns

**Command Pattern**

**Mapped Command Pattern**

`--issue --issueIdA text`

`text --suggestedBy --issueIdA`

`--issue --positionIdA text`

`text --suggestedBy --positionIdA`

`--issue --argumentIdA text`

`text --suggestedBy --argumentIdA`

`--issue --nodeIdA text`

`text --suggestedBy --nodeIdA`

`[--issue] --generalizes`

`--issue text`

`[--issue] --specializes`

`--issue text`

`[--issue] --suggestedBy`

`--issue text`

`[--issue] --questions`

`--issue text`

`--position --issueIdA`

`--respondsTo --issueIdA`

`[--issue] --respondsTo --positionIdA`

`--suggestedBy positionIdA`

`[--issue] --respondsTo --argumentIdA`

`--suggestedBy argumentIdA`

`--respondsTo`

`--position`

`--supports`

`--argument`

`--objectsTo`

`--argument`

List Command
============

The `--list` command writes Node and Link information to the console.

1.      If one nodeId is specified and the node is

1.      not the subject of any link, use Node Listing Format for this nodeId

2.      the subject of some link, use Link Listing Format for all Links where this node is subject and return in object nodeId order.

2.      If two nodeIds are specified and

1.      a link exists between the two nodes, use Link Listing format for that Link.

2.      no link exists between the two nodes, treat the same as  
`--list --nodeIdA`  
`--list --nodeIdB`

3.      If no nodeId is specified, list all Links; and all nodes that are not subject of any Link. Sort all together by subjectNodeID, objectNodeID.

Listing Format
--------------

### Node Listing Format

_nodeCode_:”_nodeText_”

Example: `p2:"pizza"`

### Link Listing Format

_subjectNodeCode:_”_subjectNodeText” --predicateName objectNodeCode:”_

Example: `p2:"pizza" --respondsTo i1:"What should we order for dinner?"`

Ontology
========

Ontology Listing
----------------

The following is based on a subset of [https://vocab.methodandstructure.com/ibis](https://vocab.methodandstructure.com/ibis)

@prefix dm: <https://ontology.chalem.com/dm/> .

@prefix owl: <http://www.w3.org/2002/07/owl#> .

@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

<https://ontology.chalem.com/dm> 

  a owl:Ontology ;

  skos:prefLabel "Dialog Mapping"@en .

dm:Argument a owl:Class ;

  rdfs:subClassOf skos:Concept ;

#   \[ a owl:Restriction ;

#      owl:onProperty dm:supports ;

#      owl:allValuesFrom dm:Position

#      \] ,

#    \[ a owl:Restriction ;

#      owl:onProperty dm:objectsTo ;

#      owl:allValuesFrom dm:Position\] ;

  owl:disjointWith dm:Position ;

  rdfs:comment "An Argument is a Concept that explicitly supports or refutes a Position."@en ;

  rdfs:isDefinedBy dm: .

#  rdfs:label "Argument"@en .

dm:Issue a owl:Class ;

  rdfs:subClassOf skos:Concept ;

#     \[ a owl:Restriction ;

#       owl:onProperty dm:generalizes ;

#       owl:allValuesFrom dm:Issue

#     \] ,

#     \[ a owl:Restriction ;

#       owl:onProperty dm:specializes ;

#       owl:allValuesFrom dm:Issue

#     \] ,

#     \[ a owl:Restriction ;

#       owl:onProperty dm:replaces ;

#       owl:allValuesFrom dm:Issue

#     \] ;

  owl:disjointWith dm:Position .

#  rdfs:isDefinedBy dm: .

#  rdfs:label "Issue"@en .

dm:Position a owl:Class ;

  rdfs:subClassOf skos:Concept ;

#    \[ a owl:Restriction ;

#      owl:onProperty dm:respondsTo ;

#      owl:allValuesFrom dm:Issue

#    \] ;

#  rdfs:isDefinedBy dm: ;

  rdfs:label "Position"@en .

dm:generalizes a owl:ObjectProperty ;

  rdfs:domain dm:Issue ;

  rdfs:range dm:Issue .

#  rdfs:isDefinedBy dm: .

#  rdfs:label "generalizes"@en .

dm:objectsTo a owl:ObjectProperty ;

  rdfs:domain dm:Argument ;

  rdfs:range dm:Position .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "objects to"@en .

dm:questions a owl:ObjectProperty ;

  rdfs:subPropertyOf dm:suggestedBy ;

  rdfs:domain dm:Issue ;

  rdfs:range skos:Concept ;

  rdfs:comment "Indicates an issue that raises doubt about a Concept."@en .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "questions"@en .

dm:replaces a owl:ObjectProperty ;

  rdfs:domain dm:Issue ;

  rdfs:range dm:Issue .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "replaces"@en .

dm:respondsTo a owl:ObjectProperty ;

  rdfs:domain dm:Position ;

  rdfs:range dm:Issue .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "responds to"@en .

dm:specializes a owl:ObjectProperty ;

  rdfs:domain dm:Issue ;

  rdfs:range dm:Issue .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "specializes"@en .

dm:supports a owl:ObjectProperty ;

  rdfs:domain dm:Argument ;

  rdfs:range dm:Position .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "supports"@en .

dm:suggestedBy a owl:ObjectProperty ;

  rdfs:domain dm:Issue ;

  rdfs:range skos:Concept .

#  rdfs:isDefinedBy dm: ;

#  rdfs:label "suggested by"@en .

Ontology Visualization
----------------------

![](Dialog+Mapping+Tool+-+Command+Language.doc_files/image005.png)