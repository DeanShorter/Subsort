---
title: "Why I Built Subscrub"
date: "2026-03-22"
excerpt: "I've been a heavy YouTube viewer for years. Over time, my subscription count crept past 400 — and the subscription page became useless. So I started building."
category: "Behind the scenes"
readTime: "6 min read"
---

I've been a heavy YouTube viewer for years. Not in a passive, leave-it-on-in-the-background way — I genuinely use it as my main source of entertainment, education, and keeping up with things I care about. Tech, sports, music, podcasts, the odd documentary rabbit hole at 2am. Over time, that meant my subscription count quietly crept past 500...

And at some point, the subscription page became useless.

YouTube gives you one feed. Every channel you've ever subscribed to, dumped into a single chronological stream. That gaming channel you followed three years ago and forgot about? It's in there. The tech reviewer who stopped uploading in 2022? Still taking up space. The podcast channel that posts four episodes a week? It's drowning out everything else.

I'd open my subscriptions, scroll for a bit, not find anything I actually wanted to watch, and end up on the algorithm-driven homepage instead. Which defeats the entire point of subscribing to channels in the first place. I subscribed to these people because I chose them — but YouTube's own interface made it impossible to actually use that list.

## The thing that annoyed me most

There was no way to browse by topic. I didn't want to see everything at once. Sometimes I'm in the mood for tech videos. Sometimes I just want to catch up on football. Sometimes I want to see what my favourite creators specifically have posted. YouTube doesn't let you do any of that with your subscriptions. It's all or nothing.

And the dead weight bothered me too. I knew there were channels in my list that hadn't uploaded in months — maybe years. But finding them meant manually scrolling through hundreds of channels and checking each one. Nobody's doing that.

## So I started building

I'm a solo developer, and this started as a personal project. I just wanted something that would pull in my subscriptions, sort them by topic automatically, and let me browse by category. That's it. A simple idea that YouTube should've built years ago but never did.

The first version was rough. I used YouTube's API to pull subscription data and their own category tags to group channels. It worked surprisingly well for most categories — tech, sports, music, gaming all sorted cleanly. Podcasts and documentaries were messier (more on that another time), but the core experience was already better than what YouTube offered.

Once the sorting worked, I added a few things that felt obvious. A favourites feed so I could see uploads from just the channels I cared about most. An inactive channel detector that flagged subscriptions I hadn't watched in months. Different view modes because sometimes I want a grid, sometimes a list.

Each feature I added made me use YouTube's actual subscription page less. At some point I realised I hadn't visited it in weeks.

## Why I'm putting it out there

I built this for myself, but the problem isn't unique to me. Anyone who's been on YouTube for a few years has a bloated subscription list and no good way to manage it. I've talked to enough people about it to know the reaction is always the same — "yeah, that's exactly my problem."

Subscrub is free to use. You connect your Google account, it pulls your subscriptions, sorts them into category feeds, and that's it. No manual setup, no tagging, no algorithm trying to decide what you should watch. Just your channels, organised the way they should've been from the start.

I'm still building. There are features I want to add, things I want to improve, and plenty of rough edges to smooth out. But it's at a point where it works and it's genuinely useful, so it felt right to share it.

If you're someone with a messy subscription list who's been wishing YouTube would just sort itself out — that's exactly why I built this.

[Try Subscrub for free →](https://usefreedly.com)
