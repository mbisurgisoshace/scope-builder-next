import { ShapeComponent } from "../types";

import { Rect } from "./core/Rect";
import { Text } from "./core/Text";
import { Image } from "./core/Image";
import { Card } from "./custom/Card";
import { Table } from "./core/Table";
import { Ellipse } from "./core/Ellipse";
import { Question } from "./custom/Question";
import { Interview } from "./custom/Interview";
import { FeatureIdea } from "./custom/FeatureIdea";
import { ProblemStatement } from "./custom/ProblemStatement";
import { QuestionAnswer } from "./custom/QuestionAnswer";
import { ExampleBrainstormCard } from "./custom/ExampleBrainstormCard";
import { TableCard } from "./custom/TableCard";
import { DbTableBlock } from "../db/blocks/TableBlock";
import { DbCollectionBlock } from "../db/blocks/CollectionBlock";
import { LogicNodeBlock } from "../logic-builder/LogicNodeBlock";

// Registry maps type to corresponding component
export const shapeRegistry: Record<string, ShapeComponent> = {
  card: Card,
  rect: Rect,
  text: Text,
  image: Image,
  table: Table,
  ellipse: Ellipse,
  question: Question,
  interview: Interview,
  feature_idea: FeatureIdea,
  question_answer: QuestionAnswer,
  example_brainstorm_card: ExampleBrainstormCard,
  table_card: TableCard,
  db_table: DbTableBlock,
  db_collection: DbCollectionBlock,
  logic_node: LogicNodeBlock,
};
