import Image from "next/image";
import { BadgeQuestionMarkIcon, HourglassIcon, StarIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Excercise1Page() {
  return (
    <div className="p-8 w-full h-full grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <ContentCard />
      </div>
      <div className="col-span-1">
        <QuizCard />
      </div>
    </div>
  );
}

const ContentCard = () => {
  return (
    <div className="h-full border-2 border-white rounded-2xl flex flex-col">
      {/* Header */}
      <div className="py-6 px-12 bg-[#6A35FF] border border-white rounded-tl-2xl rounded-tr-2xl">
        <h1 className="text-white text-2xl font-extrabold">
          3 Tips to Improve Your Customer Discovery
        </h1>
      </div>

      {/* Content*/}
      <div className="bg-white py-6 px-12 rounded-bl-2xl rounded-br-2xl flex-1 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-7">
          <Image
            width={318}
            height={264}
            alt="Excercise 1"
            src={"/excercise1.png"}
          />
          <p className="text-sm">
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be{" "}
            <span className="bg-[#E8F7EC] font-semibold">
              misinterpreted as them confirming{" "}
            </span>
            that they would pay for your product or service.{" "}
            <span className="bg-[#E8F7EC] font-semibold">
              Being supportive of your idea and being willing to pay for it are
              two very different things
            </span>
            . The goal of customer discovery is to learn, not pitch your idea.
            There will be plenty of opportunities to pitch your ideas. Customer
            discovery is not it.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="flex items-center flex-row gap-4 font-extrabold">
            <div className="w-[32px] h-[32px] rounded-full bg-[#6435ff] flex items-center justify-center text-white ">
              2
            </div>
            Learn about your customer - don't pitch your business idea
          </h3>

          <p className="text-sm">
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things.{" "}
            <span className="bg-[#E8F7EC] ">
              The goal of customer discovery is to learn, not pitch your idea.
              There will be plenty of opportunities to pitch your ideas{" "}
            </span>
            . Customer discovery is not it.
            <br />
            <br />
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things. The goal of customer discovery is to
            learn, not pitch your idea. There will be plenty of opportunities to
            pitch your ideas. Customer discovery is not it.
            <br />
            <br />
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things. The goal of customer discovery is to
            learn, not pitch your idea. There will be plenty of opportunities to
            pitch your ideas. Customer discovery is not it.
          </p>
        </div>
      </div>
    </div>
  );
};

const QuizCard = () => {
  return (
    <div className="h-full rounded-2xl flex flex-col bg-white">
      {/* Header */}
      <div className="py-6 px-8 border-b border-[#E4E5ED]">
        <h1 className="flex items-center flex-row text-xl font-semibold gap-2.5">
          <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
            <BadgeQuestionMarkIcon className="text-[#6A35FF]" size={20} />
          </div>
          <div className="flex flex-row items-center justify-between w-full">
            <div>Quiz</div>
            <div className="flex flex-row gap-6">
              <span className="text-[#697288] text-sm flex flex-row items-center gap-1.5">
                {/* <StarIcon size={16} className="text-[#03BB6E] fill-[#D1E9D7]" /> */}
                <SplitStar filled={0.6} />
                <span>4.5</span>
              </span>
              <span className="flex flex-row items-center text-[#697288] text-sm gap-1.5">
                <HourglassIcon size={16} />
                15 min
              </span>
            </div>
          </div>
        </h1>
      </div>

      {/* Content*/}
      <div className="py-6 px-8 flex flex-col gap-8 h-full">
        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">1. </span>
            Why should entrepreneurs avoid pitching their idea during customer
            discovery interviews?
          </h3>

          <RadioGroup className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2.5">
              <RadioGroupItem
                value="Because customers dislike hearing about new ideas"
                id="excercise1-question1-option1"
              />
              <Label>Because customers dislike hearing about new ideas</Label>
            </div>

            <div className="flex items-center gap-3 p-2.5">
              <RadioGroupItem
                value="Because the goal is to listen and learn from customers, not to sell"
                id="excercise1-question1-option2"
              />
              <Label>
                Because the goal is to listen and learn from customers, not to
                sell
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">2. </span>
            What is the main goal of customer discovery according to the text?
          </h3>

          <Textarea id="excercise1-question2-answer" />
        </div>

        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">3. </span>
            Which of the following statements are true about customer discovery?
            (Select all that apply)
          </h3>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 p-2.5">
              <Checkbox id="excercise1-question3-option1" />
              <Label>It helps identify real customer problems</Label>
            </div>

            <div className="flex items-center gap-3 p-2.5">
              <Checkbox id="excercise1-question3-option2" />
              <Label>Customer support equals willingness to pay</Label>
            </div>

            <div className="flex items-center gap-3 p-2.5">
              <Checkbox id="excercise1-question3-option3" />
              <Label>Interviewing customers is a key method</Label>
            </div>
          </div>
        </div>

        <Button className="bg-[#6A35FF] hover:bg-[#6133e0] text-white mt-auto cursor-pointer">
          Submit Quiz
        </Button>
      </div>
    </div>
  );
};

type SplitStarProps = {
  filled?: number;
};

const SplitStar = ({ filled = 0.5 }: SplitStarProps) => {
  const clamped = Math.max(0, Math.min(1, filled));
  const rightClip = (1 - clamped) * 100; // percentage to hide from the right

  return (
    <div className="relative inline-flex w-5 h-5">
      {/* Background star (light green) */}
      <StarIcon
        size={16}
        className="w-full h-full"
        fill="#D1E9D7" // light green
        strokeWidth={0} // remove stroke so it's just fill
      />

      {/* Foreground star (dark green, clipped) */}
      <StarIcon
        size={16}
        className="w-full h-full absolute inset-0"
        fill="#03BB6E" // darker green
        strokeWidth={0}
        style={{
          // inset: top right bottom left
          // we hide some of the right side so it “fills” from left to right
          clipPath: `inset(0 ${rightClip}% 0 0)`,
        }}
      />
    </div>
  );
};
