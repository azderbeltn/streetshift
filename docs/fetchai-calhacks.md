# Fetch.ai at CalHacks 13.0: prize requirements and submission checklist

Fetched: 2026-10-24.

Sources:
- https://www.fetch.ai/events/calhacks-13-0 (event page: prizes, judges; links to the hackpack)
- https://www.fetch.ai/events/hackathons/calhacks-13-0/hackpack (challenge statement, mandatory requirements, judging criteria, what to submit). Text extracted from server-rendered HTML; content below is verbatim apart from whitespace/formatting.
- https://docs.google.com/document/d/1UDW-X1C24hxZviFOQzjTeh0pXRNAoflMb8lhJqZP9Z0 ("Cal Hacks ASI:One Submission — Deliverables & How to Submit", linked from the hackpack; exported as text, verbatim)
- Submission agent entry point: https://asi1.ai/auth/signup?returnTo=%2Ffestival%2Fcalhacks2026%2Fdashboard%3Futm_source%3Dcalhacks2026
- Submission process video: https://drive.google.com/file/d/1EDfKrM7l8soO-40eKkPYDAEkRUTwQKyf (not fetched; video)

## Checklist for StreetShift (derived by the saver from the sources below)
- [ ] At least one agent registered on Agentverse (we run 5: Analyst + 4 stakeholders, local with `mailbox=True`).
- [ ] Agent Chat Protocol implemented (`publish_manifest=True`).
- [ ] Discoverable and directly usable through ASI:One; full primary workflow ("What happens if NYC pedestrianizes X?" -> sim run -> metrics + link) completes inside one ASI:One conversation, no custom frontend required.
- [ ] Meaningful tool execution / multi-agent orchestration (Analyst calls /sim; stakeholders message each other).
- [ ] Public GitHub repo with run/test instructions.
- [ ] README.md lists every agent's name and address; mention extra resources needed with links.
- [ ] Both badges in the agent README(s): `![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)` and `![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)`.
- [ ] Demo video 3-5 minutes showing the agents.
- [ ] Devpost submission.
- [ ] Register via the "Cal Hacks ASI:One Submission" agent in ASI:One: project name, name, email, team size, problem statement, GitHub URL, Devpost URL, demo video URL; optional (bonus) Agentverse agent profile URLs and ASI:One shared chat URLs (e.g. https://asi1.ai/shared-chat/...). Status must read "Submitted".
- Recommended/bonus: ASI1 Interactive Cards (see docs/fetchai-extras.md), Payment Protocol, multi-agent collaboration, reliability/error handling, real-time data, agent that keeps operating after the hackathon.
- Note: the hackpack "Quick start example" code is reproduced verbatim and has an indentation bug in `create_text_chat` (the `return` is over-indented) and omits `from uagents import Agent, Context, Protocol`; use the code in docs/fetchai.md instead.
- Offer: one month free ASI:One Pro + Agentverse Premium, code shown on page as "CALHACKS26CALHACKS26AV" (likely a rendering duplicate; may be two codes CALHACKS26 / CALHACKS26AV).

---

# [Saved page] Hackpack (verbatim text)

# CalHacks 13.0
Bring your big ideas, your wild “what ifs,” and your curiosity to CalHacks 13.0!

### 🎉 Exclusive Offer
Unlock One Month Free access to ASI:One Pro (https://drive.google.com/file/d/17iBT9I2xnllnYerECd53nnhAfOxS-WdD/view?usp=drive_link) and Agentverse Premium (https://drive.google.com/file/d/1adhDjri7DvzGwEcZNlVlHj7rweMdv_0u/view?usp=drive_link)
Use code:CALHACKS26CALHACKS26AV

October 23, 2026

Palace of Fine Arts, 3301 Lyon St, San Francisco, CA 94123, USA
RegisterView Details

## Prizes

Best Use of Fetch.ai - 1st Prize

$1250
Cash + Internship Interview Opportunity

Best Use of Fetch.ai - 2nd Prize

$750
Cash + Internship Interview Opportunity

Best Use of Fetch.ai - 3rd Prize

$500
Cash + Internship Interview Opportunity

Special Recognition Prize

$250
Cash Prize

Special Recognition Prize

$250
Cash Prize

Introduction

Fetch.ai is your gateway to the agentic economy. It provides a full ecosystem for building, deploying, and discovering AI Agents.
Pillars of the Fetch.ai Ecosystem
- Agentverse - The open marketplace for AI Agents. You can publish agents built with uAgents or any other agentic framework, making them searchable and usable by both users and other agents.
- ASI:One – The world’s first agentic LLM and the discovery layer for Agentverse. When a user submits a query, ASI:One identifies the most suitable agent and routes the request for execution.

Challenge statement

# ASI:One Agent Challenge – From Intent to Action 
## The Challenge 
Most AI applications stop at conversation. Your challenge is to build an AI agent that can be discovered through ASI:One (https://asi1.ai/), understand a user's intent, and take meaningful action to solve a real-world problem. 
Your agent might coordinate services, automate workflows, analyze live information, make recommendations, complete transactions, collaborate with other specialized agents, or execute multi-step tasks. The result should be more than a chatbot or a thin wrapper around an API. 
## What to Build 
Build a single agent or multi-agent system that:  
- Solves a clearly defined real-world problem. 
- Performs multi-step planning, reasoning, or orchestration. 
- Uses tools, APIs, external services, data sources, MCP, or other agents to produce an executable outcome. 
- Is registered on Agentverse (https://agentverse.ai/) and discoverable through ASI:One (https://asi1.ai/). 
- Implements the Agent Chat Protocol (ACP). 
- Allows the complete primary workflow to be demonstrated directly inside an ASI:One conversation without requiring a custom frontend. 
- (Recommended) Uses ASI1 Interactive Cards (https://innovationlab.fetch.ai/resources/docs/interactive-cards/asi-interactive-cards) to provide rich, guided user interactions such as forms, carousels, review screens, detail views, or custom interactive layouts directly inside ASI:One conversations.  
You may use any framework, including Google ADK, LangGraph, CrewAI, OpenAI Agents SDK, Claude Agent SDK, uAgents, or plain Python. 
## Mandatory Requirements 
To be eligible for prizes, your project must:  
- Register at least one agent on Agentverse (https://agentverse.ai/). 
- Implement the Agent Chat Protocol (ACP). 
- Be discoverable and directly usable through ASI:One (https://asi1.ai/). 
- Demonstrate meaningful tool execution or multi-agent orchestration. 
- Complete the primary user workflow entirely within an ASI:One conversation. 
- Submit a public GitHub repository with instructions to run or test the project.  
## Bonus Points 
Projects may receive additional consideration for:  
- Effective multi-agent collaboration. 
- Implementation of the Payment Protocol with a credible monetization model. 
- Effective use of ASI Interactive Cards (https://innovationlab.fetch.ai/resources/docs/interactive-cards/asi-interactive-cards) to create intuitive, guided, and action-oriented user experiences inside ASI:One. 
- Strong reliability, error handling, and recovery from failed tool calls. 
- Creative use of real-time data and external services. 
- An agent that could realistically continue operating after the hackathon.  
## Deliverables & How to Submit  
- Submit your project through Devpost 
- You also need to register your submission through the CalHacks Hackathon ASI:One Submission Agent (https://asi1.ai/auth/signup?returnTo=%2Ffestival%2Fcalhacks2026%2Fdashboard%3Futm_source%3Dcalhacks2026) (steps below). Watch the video here : Submission Process on ASI:One (https://drive.google.com/file/d/1EDfKrM7l8soO-40eKkPYDAEkRUTwQKyf) 
- Refer to this document (https://docs.google.com/document/d/1UDW-X1C24hxZviFOQzjTeh0pXRNAoflMb8lhJqZP9Z0) for full information 

Important links
How to create an Agent with uAgents Framework ↗ (https://innovationlab.fetch.ai/resources/docs/agent-creation/uagent-creation)Communication between two uAgents ↗ (https://innovationlab.fetch.ai/resources/docs/agent-communication/uagent-uagent-communication)How to create ASI:One compatible uAgents ↗ (https://innovationlab.fetch.ai/resources/docs/examples/chat-protocol/asi-compatible-uagents)ASI:One API ↗ (https://innovationlab.fetch.ai/resources/docs/asione/asi-one-quickstart)Innovation Lab GitHub Repo ↗ (https://github.com/fetchai/innovation-lab-examples)Past Hackathon Projects ↗ (https://innovationlab.fetch.ai/projects)

Examples to get you started:

Guide
How to Connect a Local Agent to Agentverse ↗ (https://innovationlab.fetch.ai/resources/docs/agent-creation/uagent-creation#mailbox-agents)
Guide
How to Integrate ASI:One LLM with your uAgent ↗ (https://innovationlab.fetch.ai/resources/docs/examples/asione/asi1-mini-language-tutor)
Guide
How to create an Image Generation Agent ↗ (https://innovationlab.fetch.ai/resources/docs/examples/chat-protocol/image-generation-agent)
Guide
Agentverse MCP Server ↗ (https://docs.agentverse.ai/documentation/advanced-usages/agentverse-mcp)
Guide
MCP Integration Example ↗ (https://innovationlab.fetch.ai/resources/docs/mcp-integration/what-is-mcp)
Guide
Read our Medium Articles ↗ (https://medium.com/fetch-ai/latest)

What to Submit

-  
Code  
- Share the link to your public GitHub repository to allow judges to access and test your project. 
- Ensure your 

```
README.md
```
 file includes key details about your agents, such as their name and address, for easy reference. 
- Mention any extra resources required to run your project and provide links to those resources. 
- All agents must be categorized under Innovation Lab.  
-  
To achieve this, include the following badge in your agent’s 

```
README.md
```
 file: 
```

```
![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)

```

```

```

```
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

```

```

-  
Video  
- Include a demo video (3–5 minutes) demonstrating the agents you have built.   

Quick start example
This file can be run on any platform supporting Python, with the necessary install permissions. This example shows two agents communicating with each other using the uAgent python library. 
Try it out on Agentverse ↗ (https://agentverse.ai/)

```
from datetime import datetime
from uuid import uuid4
from uagents.setup import fund_agent_if_low
from uagents_core.contrib.protocols.chat import (
   ChatAcknowledgement,
   ChatMessage,
   EndSessionContent,
   StartSessionContent,
   TextContent,
   chat_protocol_spec,
)

agent = Agent()

# Initialize the chat protocol with the standard chat spec
chat_proto = Protocol(spec=chat_protocol_spec)

# Utility function to wrap plain text into a ChatMessage
def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    content = [TextContent(type="text", text=text)]
        return ChatMessage(
        timestamp=datetime.utcnow(),
        msg_id=uuid4(),
        content=content,
        )

# Handle incoming chat messages
@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
   ctx.logger.info(f"Received message from {sender}")

   # Always send back an acknowledgement when a message is received
   await ctx.send(sender, ChatAcknowledgement(timestamp=datetime.utcnow(), acknowledged_msg_id=msg.msg_id))

   # Process each content item inside the chat message
   for item in msg.content:
       # Marks the start of a chat session
       if isinstance(item, StartSessionContent):
           ctx.logger.info(f"Session started with {sender}")

       # Handles plain text messages (from another agent or ASI:One)
       elif isinstance(item, TextContent):
           ctx.logger.info(f"Text message from {sender}: {item.text}")
           #Add your logic
           # Example: respond with a message describing the result of a completed task
           response_message = create_text_chat("Hello from Agent")
           await ctx.send(sender, response_message)

       # Marks the end of a chat session
       elif isinstance(item, EndSessionContent):
           ctx.logger.info(f"Session ended with {sender}")
       # Catches anything unexpected
       else:
           ctx.logger.info(f"Received unexpected content type from {sender}")

# Handle acknowledgements for messages this agent has sent out
@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
   ctx.logger.info(f"Received acknowledgement from {sender} for message {msg.acknowledged_msg_id}")

# Include the chat protocol and publish the manifest to Agentverse
agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__": 
    agent.run()

```

Agentverse MCP Server
Learn how to deploy your first agent on Agentverse with Claude Desktop in Under 5 Minutes

Agentverse MCP (Full Server)
Client connection URL: https://mcp.agentverse.ai/sse

Agentverse MCP-Lite
Client connection URL: https://mcp-lite.agentverse.ai/mcp

Video introduction

Introduction to agents

On Interval

On Event

Agent Messages

Tool Stack

Judging Criteria

-  
Functionality & Technical Implementation (25%)  
- Does the agent system work as intended? 
- Are the agents properly communicating and reasoning in real time?   
-  
Use of Fetch.ai Technology (20%)  
- Are agents registered on Agentverse? 
- Is the Chat Protocol implemented for ASI:One discoverability? 
- Is the Payment Protocol integrated to enable monetisation?   
-  
Innovation & Creativity (20%)  
- How original or creative is the solution? 
- Is it solving a problem in a new or unconventional way?   
-  
Real-World Impact & Usefulness (20%)  
- Does the solution solve a meaningful problem? 
- How useful would this be to an end user?   
-  
User Experience & Presentation (15%)  
- Is the solution presented clearly with a well-structured demo? 
- Is there a smooth and intuitive user experience?   

Judges

Sana Wajid
Chief Development & Operations Officer - Fetch.ai 
 Chief Operations Officer - Innovation Lab

Rajashekar Vennavelli
Senior AI Engineer, Fetch.ai

Mentors

Devam Sheth
Software Engineer

Aldridge Fonseca
Software Engineer Intern

Gitika Rath
Software Engineer Intern

Davel Radindra
Software Engineer

Shambhavi Kumar

---

# [Saved page] Cal Hacks ASI:One Submission — Deliverables & How to Submit (Google Doc, verbatim)

```text
Cal Hacks ASI:One Submission — Deliverables & How to Submit
Submission Process
* Submit your project through Devpost.
* Register your submission through the Cal Hacks ASI:One Submission Agent (steps below). Watch the video here : Submission Process on ASI:One
Before You Start: Get Your URLs Ready
ASI:One Shared Chat URL
* Go to asi1.ai and open the chat where you demo your agent.
* Click the search icon in the left sidebar.
* Under Current chat, click Share chat.
* Copy the link (e.g. https://asi1.ai/shared-chat/...).
Agentverse Agent Profile URL
* Go to agentverse.ai and open your agent.
* Go to the agent's profile page.
* Copy the URL (e.g. https://agentverse.ai/agents/details/agent1q.../profile).
* Repeat for each agent you built.
Team Lead: Create Your Submission
1. In ASI:One, message Cal Hacks ASI:One Submission agent. Something simple like "Hi"  works.
2. On the welcome card, click Create team (I'm the lead).
3. Fill in the required details:


Field
	Required?
	Project name
	Yes
	Table number
	Optional
	Your name
	Yes
	Your email
	Yes
	Team size including you (1–4)
	Yes
	What problem does your project solve?
	Yes
	Public GitHub repository URL
	Yes
	Devpost project URL
	Yes
	Demo video URL
	Yes
	Bonus Points: Agentverse Agents & ASI:One Shared Chats (Optional)
* How many agents did you build? Set the number.
* Agent profile URLs: Paste them, separated by commas.
* How many shared chats? Set the number.
* Shared chat URLs: Paste them, separated by commas.
4. Click Continue to review.
5. Check your details:
   1. Everything correct? Click Confirm submission.
   2. Need a change? Click Edit details, update the form, then Continue to review again.
6. After you confirm, you'll get a Team ID (e.g. lahacks-ce25ed57). Share it with your teammates.
Teammates: Join Your Team
1. In ASI:One, start a chat with Cal Hacks ASI:One Submission agent (e.g. "Hi").
2. Click Join with Team ID.
3. Enter the Team ID from your lead and click Continue.
4. Enter your name and email, then click Join team.
Submission Status


Status
	Meaning
	Incomplete
	Your details are saved. Still waiting for teammates to join.
	Submitted
	All teammates have joined. You're done! ✅
	

Note: The team lead can click Edit details any time before the deadline.
```
