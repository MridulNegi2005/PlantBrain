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
  response: CopilotAnswer
}

type EvidenceSelection = {
  citations: Citation[]
  graphPath: string[]
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
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const response = await askCopilot(trimmed, assetTag.trim() || undefined)
      setExchanges((current) => [
        ...current,
        { id: crypto.randomUUID(), question: trimmed, response },
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
        <div className="flex min-h-[42rem] min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <BrainCircuitIcon className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Evidence-grounded copilot</p>
                <p className="text-xs text-muted-foreground">Asset scope: {assetTag || "plant-wide"}</p>
              </div>
            </div>
            <Badge variant="outline">No source · no answer</Badge>
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
                            <EmptyTitle>Ask from the plant record</EmptyTitle>
                            <EmptyDescription>
                              PlantBrain answers only when retrieved evidence supports the response. Start with the prepared P-204A investigation.
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
                                <MessageHeader>You</MessageHeader>
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
                                <MessageHeader>PlantBrain · cited reasoning</MessageHeader>
                                {grounded ? (
                                  <Bubble variant="ghost">
                                    <BubbleContent className="flex flex-col gap-4">
                                      <p className="text-base leading-relaxed">{exchange.response.answer}</p>

                                      {exchange.response.missing_evidence?.length ? (
                                        <Alert>
                                          <FileSearchIcon />
                                          <AlertTitle>Evidence still missing</AlertTitle>
                                          <AlertDescription>
                                            <ul className="flex list-disc flex-col gap-1 pl-4">
                                              {exchange.response.missing_evidence.map((item) => <li key={item}>{item}</li>)}
                                            </ul>
                                          </AlertDescription>
                                        </Alert>
                                      ) : null}

                                      {exchange.response.recommended_next_actions?.length ? (
                                        <div>
                                          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Recommended checks</p>
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
                                        <span>No answer was returned because supporting citations are missing.</span>
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
                                    <Badge variant="destructive">{exchange.response.reason ?? "no_supporting_evidence"}</Badge>
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
                            <Bubble variant="muted"><BubbleContent className="flex items-center gap-2"><Spinner /> Retrieving cited evidence…</BubbleContent></Bubble>
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
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault()
                        event.currentTarget.form?.requestSubmit()
                      }
                    }}
                    placeholder="Ask an evidence-backed operational question…"
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
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Query scope</p>
            <Field className="mt-4">
              <FieldLabel htmlFor="asset-scope">Asset tag</FieldLabel>
              <InputGroup>
                <InputGroupAddon><BrainCircuitIcon /></InputGroupAddon>
                <InputGroupTextarea
                  id="asset-scope"
                  value={assetTag}
                  onChange={(event) => setAssetTag(event.target.value.toUpperCase())}
                  rows={1}
                  className="min-h-8"
                />
              </InputGroup>
              <FieldDescription>Leave blank for plant-wide retrieval.</FieldDescription>
            </Field>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Answer contract</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
              <p>Direct answer grounded in retrieved chunks.</p>
              <Separator />
              <p>Confidence and exact source citations.</p>
              <Separator />
              <p>Missing evidence and next checks.</p>
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
            <SheetTitle>Source evidence</SheetTitle>
            <SheetDescription>Exact documents and page-level excerpts supporting this answer.</SheetDescription>
          </SheetHeader>
          <Separator />
          <ScrollArea className="min-h-0 flex-1 px-4">
            <div className="evidence-spine flex flex-col gap-5 pb-6 pl-7">
              {selectedEvidence?.citations.map((citation, index) => (
                <article key={`${citation.document}-${citation.page}-${index}`} className="relative rounded-lg border bg-background p-4 before:absolute before:-left-[1.68rem] before:top-5 before:size-3 before:rounded-full before:border-2 before:border-primary before:bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{citation.document}</p>
                    <Badge variant="outline">Page {citation.page}</Badge>
                  </div>
                  {citation.quote ? <blockquote className="mt-3 border-l-2 border-primary/60 pl-3 text-sm leading-relaxed text-muted-foreground">“{citation.quote}”</blockquote> : null}
                  {citation.chunk_id ? <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">{citation.chunk_id}</p> : null}
                </article>
              ))}
            </div>
            {selectedEvidence?.graphPath.length ? (
              <div className="mb-6 rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Graph reasoning path</p>
                <p className="mt-2 font-mono text-xs leading-relaxed">{selectedEvidence.graphPath.join(" → ")}</p>
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
