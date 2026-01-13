"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetTitle,
  SheetFooter,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createProject } from "@/services/projects";

export function NewProject() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");

  const onCreateProject = async () => {
    const newProject = await createProject(projectName);
    setProjectName("");
    router.push(`/projects/${newProject.id}`);
  };

  return (
    <Sheet onOpenChange={() => setProjectName("")}>
      <SheetTrigger asChild>
        <Button variant="outline">+ New Project</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create a new Project</SheetTitle>
        </SheetHeader>
        <div className="grid flex-1 auto-rows-min gap-6 px-4">
          <div className="grid gap-3">
            <Label htmlFor="sheet-demo-name">Name</Label>
            <Input
              value={projectName}
              id="sheet-demo-name"
              placeholder="Project Name"
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
        </div>
        <SheetFooter>
          <Button type="button" onClick={onCreateProject}>
            Create
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
