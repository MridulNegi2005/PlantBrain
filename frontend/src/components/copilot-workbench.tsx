"use client"

import { FormEvent, useState } from "react"
import {
  BotIcon,
  BrainCircuitIcon,
  FileSearchIcon,
  SendIcon,
  ShieldXIcon,
  UserIcon,
} from "lucide-react"

import { CitationList } from "@/components/citation-list"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { askCopilot } from "@/lib/api/client"
import type { Citation, CopilotAnswer } from "@/lib/api/types"
import { percent } from "@/lib/format"

type Exchange = {
  id: string
  question: string
  assetTag?: string
  response: CopilotAnswer
}

type EvidenceSelection = {
  citations: Citation[]
  graphPath: string[]
}

function reasonLabel(reason?: string | null) {
  switch (reason) {
    case "unsafe_evidence":
      return "Blocked a suspicious document"
    case "no_supporting_evidence":
    default:
      return "No supporting document found"
  }
}

export function CopilotWorkbench() {
  const [question, setQuestion] = useState("Why did P-204A fail twice this month?")
  const [assetTag, setAssetTag] = useState("P-204A")
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceSelection | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmed = question.trim()
    const requestedAssetTag = assetTag.trim().toUpperCase() || undefined
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await askCopilot(trimmed, requestedAssetTag)
      setExchanges((current) => [
        ...current,
        { id: crypto.randomUUID(), question: trimmed, assetTag: requestedAssetTag, response },
      ])
      setQuestion("")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The copilot request failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="grid min-h-[42rem] gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-h-[42rem] min-w-0 flex-col overflow-hidden rounded-sm border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Ask PlantBrain</p>
                <p className="font-mono text-[0.62rem] text-muted-foreground">Focused on: {assetTag || "the whole plant"}</p>
              </div>
            </div>
            <Badge variant="outline">Always cites its sources</Badge>
          </div>

          <div className="min-h-0 flex-1">
            <MessageScrollerProvider autoScroll>
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent className="p-4 sm:p-6">
                    {!exchanges.length ? (
                      <MessageScrollerItem messageId="empty-state">
                        <Empty className="min-h-[24rem]">
                          <EmptyHeader>
                            <EmptyMedia variant="icon"><BotIcon /></EmptyMedia>
                            <EmptyTitle>Ask a question to get started</EmptyTitle>
                            <EmptyDescription>
                              PlantBrain only answers when it can back it up with a real document. Try the example question below about pump P-204A.
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      </MessageScrollerItem>
                    ) : null}

                    {exchanges.map((exchange) => {
                      const grounded = Boolean(exchange.response.answer && exchange.response.citations.length)
                      return (
                        <div key={exchange.id} className="contents">
                          <MessageScrollerItem messageId={`${exchange.id}-question`} scrollAnchor>
                            <Message align="end">
                              <MessageAvatar>
                                <Avatar><AvatarFallback><UserIcon /></AvatarFallback></Avatar>
                              </MessageAvatar>
                              <MessageContent>
                                <MessageHeader>You / {exchange.assetTag ?? "PLANT-WIDE"}</MessageHeader>
                                <Bubble align="end"><BubbleContent>{exchange.question}</BubbleContent></Bubble>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>

                          <MessageScrollerItem messageId={`${exchange.id}-answer`}>
                            <Message>
                              <MessageAvatar>
                                <Avatar><AvatarFallback>PB</AvatarFallback></Avatar>
                              </MessageAvatar>
                              <MessageContent>
                                <MessageHeader>PlantBrain · answer with sources</MessageHeader>
                                {grounded ? (
                                  <Bubble variant="ghost">
                                    <BubbleContent className="flex flex-col gap-4">
                                      <p className="text-base leading-relaxed">{exchange.response.answer}</p>

                                      {exchange.response.note ? (
                                        <Alert>
                                          <FileSearchIcon />
                                          <AlertTitle>Retrieval note</AlertTitle>
                                          <AlertDescription>{exchange.response.note}</AlertDescription>
                                        </Alert>
                                      ) : null}

                                      {exchange.response.missing_evidence?.length ? (
                                        <Alert>
                                          <FileSearchIcon />
                                          <AlertTitle>What's still missing</AlertTitle>
                                          <AlertDescription>
                                            <ul className="flex list-disc flex-col gap-1 pl-4">
                                              {exchange.response.missing_evidence.map((item) => <li key={item}>{item}</li>)}
                                            </ul>
                                          </AlertDescription>
                                        </Alert>
                                      ) : null}

                                      {exchange.response.recommended_next_actions?.length ? (
                                        <div>
                                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">What to check next</p>
                                          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm">
                                            {exchange.response.recommended_next_actions.map((action) => <li key={action}>{action}</li>)}
                                          </ol>
                                        </div>
                                      ) : null}
                                    </BubbleContent>
                                  </Bubble>
                                ) : (
                                  <Bubble variant="destructive">
                                    <BubbleContent>
                                      <div className="flex items-start gap-2">
                                        <ShieldXIcon className="mt-0.5 size-4 shrink-0" />
                                        <span>No answer — PlantBrain couldn't find a document to back this up, so it won't guess.</span>
                                      </div>
                                    </BubbleContent>
                                  </Bubble>
                                )}
                                <MessageFooter className="gap-2">
                                  {grounded ? (
                                    <>
                                      <Badge variant="outline">
                                        Confidence {percent(exchange.response.confidence ?? 0)}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="xs"
                                        onClick={() =>
                                          setSelectedEvidence({
                                            citations: exchange.response.citations,
                                            graphPath: exchange.response.graph_path ?? [],
                                          })
                                        }
                                      >
                                        <FileSearchIcon data-icon="inline-start" />
                                        {exchange.response.citations.length} citation{exchange.response.citations.length === 1 ? "" : "s"}
                                      </Button>
                                    </>
                                  ) : (
                                    <Badge variant="destructive">{reasonLabel(exchange.response.reason)}</Badge>
                                  )}
                                </MessageFooter>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        </div>
                      )
                    })}

                    {busy ? (
                      <MessageScrollerItem messageId="copilot-thinking">
                        <Message>
                          <MessageAvatar><Avatar><AvatarFallback>PB</AvatarFallback></Avatar></MessageAvatar>
                          <MessageContent>
                            <Bubble variant="muted"><BubbleContent className="flex items-center gap-2"><Spinner /> Reading the documents…</BubbleContent></Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ) : null}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          </div>

          <form onSubmit={submit} className="border-t p-3 sm:p-4">
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="copilot-question" className="sr-only">Question</FieldLabel>
                <InputGroup>
                  <InputGroupTextarea
                    id="copilot-question"
                    value={question}
                    maxLength={2_000}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    placeholder="e.g. Why did pump P-204A fail twice this month?"
                    aria-invalid={Boolean(error)}
                  />
                  <InputGroupAddon align="block-end" className="justify-between">
                    <InputGroupText>Enter to send · Shift+Enter for a new line</InputGroupText>
                    <InputGroupButton type="submit" variant="default" disabled={!question.trim() || busy}>
                      {busy ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
                      Ask
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </Field>
            </FieldGroup>
          </form>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-sm border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Focus the question</p>
            <Field className="mt-4">
              <FieldLabel htmlFor="asset-scope">Equipment tag</FieldLabel>
              <InputGroup>
                <InputGroupAddon><BrainCircuitIcon /></InputGroupAddon>
                <InputGroupTextarea
                  id="asset-scope"
                  value={assetTag}
                  maxLength={64}
                  onChange={(event) => setAssetTag(event.target.value.toUpperCase())}
                  rows={1}
                  className="min-h-8"
                />
              </InputGroup>
              <FieldDescription>Leave blank to search the whole plant.</FieldDescription>
            </Field>
          </div>
          <div className="rounded-sm border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Every answer includes</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>A direct answer, drawn only from your documents.</p>
              <Separator />
              <p>The exact sources it used, and how confident it is.</p>
              <Separator />
              <p>Anything it couldn't find, and what to check next.</p>
            </div>
          </div>
        </aside>
      </div>

      <Sheet
        open={Boolean(selectedEvidence)}
        onOpenChange={(open) => {
          if (!open) setSelectedEvidence(null)
        }}
      >
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Where this answer came from</SheetTitle>
            <SheetDescription>The exact documents and passages behind this answer.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="min-h-0 flex-1 px-4">
            <div className="pb-6">
              <CitationList citations={selectedEvidence?.citations ?? []} />
            </div>
            {selectedEvidence?.graphPath.length ? (
              <div className="mb-6 rounded-sm border bg-muted p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">How PlantBrain connected the facts</p>
                <p className="mt-2 font-mono text-xs leading-relaxed">{selectedEvidence.graphPath.join(" → ")}</p>
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
