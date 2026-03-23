const portfolioData = {
  // Journey into Tech - chronological entries
  journey: [
    {
      year: "...",
      title: "Let there be... drones?",
      description: "Exploring the frontier in the electronics realm, I was very interested and had some novice experience in electronics, drones and embedded systems (Arduino).\
      However, it all started with a Drone I had as a kid. It was a mid-range racer type, remote controlled remote.\
      At a certain moment, it broke down, a wire had been cut, I figured that if I just taped it well enough, it'd work again, and it did!\
      Eventually, it kept breaking, so I made my way to the port where the wire was connected, and replaced it.\
      \
      What pulled me into the software side of tech, was that I once was trying to optimize my Windows 7 Desktop into running Flash Games on Newegg, \
      it was running quite laggy, and there was a taxi simulator game that I really liked, as well as a disc game a neighbor gave us, a jet simulator. \
      I accidentally uninstalled too many critical programs from the \x86 directory (iirc) and some printer stuff broke! \
      I browsed the web, and something I had to do was modify the registry and manually install some programs through the command line! \
      Yes, before becoming a Linux power-user, I was a Windows 7 shell apprentice, it was a humbling experience...",
      tags: ["Interests", "Arduino", "Embedded", "Electronics", "Drones"]
    },
    {
      year: "2017",
      title: "The Awakening",
      description: "Began my journey into the digital realm, exploring the fundamentals of computing, networks and cybersecurity. \
      I bought my own laptop and almost immediately installed Linux; Manjaro. I picked it due to how light-weight and easy it was \
      on my battery! It could last about 17 hours doing light-coding. And very customizable. But I broke it, and eventually made my way to Arch Linux, which I still use today. \
      I started getting into robotics, using ATMega (Arduinos) and some ESP32s, I built some simpler robotics with servos and RF sensors for control :)",
      tags: ["Foundations", "Robotics"]
    },
    {
      year: "2022",
      title: "Deep Dive",
      description: "Delved deeper into networked systems, embedded programming, and cybersecurity. Started building projects for University and personal alike. \
      It was sometime before this where I got more expensive equipment, embedded systems and some Raspberry Pi 's, and set up my homelab. \
      From that era onwards I was doing plenty of stuff in my own time, ranging from simple networked applications, and more medium sized embedded projects on an STM32. \
      I learned about FreeRTOS, did some security research about the platform and begun researching and experimenting in malware development; metamorphic and polymorphic malwares caught my eye!",
      tags: ["Computer Networks", "Embedded Systems", "Cybersecurity", "STM32"]
    },
    {
      year: "In-Between",
      title: "Development",
      description: "I kept doing more and researching more concerning networked, distributed systems, this is where my interests are leading me, as well as embedded systems and its corresponding environment. \
      I kept some of my experience and knowledge from previous work experience and personal projects and wanted to do something more... \
      Eventually I got a summer job opportunity (which they wanted me to stay working there year long until graduation, but I was going to take some difficult classes, I also had many responsibitilies personally, so I couldn't), \
      it was a nice experience because I could keep researching better ways of developing in an OOP environment and experiment with API development, which was fun!",
      tags: ["Work", "Object Oriented Programming", "APIs"]
    },
    {
      year: "2025",
      title: "Graduation",
      description: "Graduated University, below in achievements I describe further of my final project, which combines many of my skill set :3",
      tags: ["Graduation"]
    },
    {
      year: "Today",
      title: "Awaiting",
      description: "Now, you see you're here, and me too, we're here, what now? \
      Well, maybe you're wondering why I designed this portfolio like this, you've seen the Matrix (maybe?), though if you're a reader, then you've read Neuromancer (maybe? x2). \
      Of course, I'm not saying I'm Case, but I'm not denying it either, if you're a technical person, please don't tell HR about this, they'll be spooked! \
      I also really liked Diaspora by Greg Egan, I wanted to create what my personal 'scape' would look like. I think this may be it, though perhaps some non-eucledian geometry would be present...",
      tags: ["Awkward", "Sci-Fi", "Neuromancer", "Diaspora", "Cryptonomicon", "<--- iykyk", "Penguins"]
    }
  ],

  // Projects - work showcase
  projects: [
    {
      name: "eIRC",
      description: "What if a machine from the 90s could talk to a modern cloud application seamlessly? \
      Internet Relay Channel, so far, my favorite project. At its heart, eIRC is a networked node system. Think of it like a private internet within your infrastructure — \
      nodes can be created, registered, and coordinated through a central tracker, and they can all talk to each other in real time. \
      It permits creating Hubs (Trackers), Nodes (Servers) and Endpoints (Clients), just like a traditional IRC. \
      But it also has modular command handlers, allowing dynamic data processing and messsage passing. It creates a way to 'revive' old CPU/Embedded Systems to be part of a greater Node. \
      Allowing IOT interoperability across many platforms, without having to rely on modern 64-bit only software to coordinate different platforms. \
      It allows dynamic scalability across distributed nodes. And easy modification for command modules. \
      So far, I'm implementing Redis and ClickHouse to the project's Tracker Hubs and Nodes (maybe I'll have it done by time you read this?), \
      this'll allow me to have persistent storage and long term data analytic capabilities! \
      This project touches on systems programming, network architecture, distributed design, and even data engineering. ",
      technologies: ["C++", "ClickHouse", "Python", "Distributed Systems", "Embedded Systems", "Network Programming", "Linux", "OpenMP", "Redis"],
      status: "Active",
      link: "https://github.com/fengwyn/eIRC"
    },
    {
      name: "Distributed Systems",
      description: "A scalable distributed systems for a University project, uh short description, I know... The previously aforementioned project blows this out the water lol. \
      However, this one was built prior to the advent of AI; so it means I'm legit :)",
      technologies: ["Python", "Distributed Systems", "Scalability", "mySQL", "json"],
      status: "Completed",
      link: "https://github.com/fengwyn/DistributedFileSystem"
    },
    {
      name: "Embedded Systems",
      description: "I have built simple gadgets to functional and walking robots, some using pre-built kits, some modified and many from scratch. \
      Gadgets from temperature, movement sensors, to network access points, micro controllers connected with radio frequency modules; Satellite Imagery, TCP/IP packets via RF.",
      technologies: ["Embedded Systems", "Robotics", "Electronics", "C", "C++", "FreeRTOS", "Radio Frequency", "SDR", "TCP/IP", "Arduino", "ESP32", "STM32", "Linux", "Raspberry Pi"],
      status: "Active",
      link: null
    },
    {
      name: "Embedded Linux IoT Node",
      description: "Currently building a building a custom Yocto Linux image for BeaglePlay, integrating an SDR radio stack \
      and Node Relay application layer to create a networked sensor platform, targeting manufacturability and minimal footprint \
      This has provived me with hands-on experience with BSP configuration, custom layer and directory structure, minimal kernel image\
      composition, and cross-compilation toolchain setup for ARM devices. I'm also experimenting with FPGA MicroBlaze, which is similar \
      and will apply my Hardware (FPGA) skills to building Accelerated Modules :)",
      technologies: ["Embedded Systems", "Internet-Of-Things", "FPGA", "BeagleBoard", "C", "C++", "RTL V3", "TCP/IP", "Hardware", "OpenMP"],
      status: "Active",
      link: null
    },
    {
      name: "Hardware Network Security",
      description: "Software secures networks. But what if the security itself lived inside the hardware? \
      Hardware-accelerated network security solutions using FPGA for real-time packet inspection. This was really hard because I had to self-teach Digital Systems to myself, using some old books!!!\
      But I learned *a lot*, with this, I can confidently say I can work at any level of the technology spectrum, well, maybe not the atomic level. Who knows, maybe one day? (jk). \
      This also helped me identify an algorithm used by a cipher, it was a block linear feedback shift register, that they applied on a plaintext, to obtain the ciphertext (the key was '-1' xd).",
      technologies: ["Verilog", "Digital Systems Design", "Ethernet", "FPGA", "Network Security", "TCP/IP", "W5500"],
      status: "Research",
      link: "https://github.com/fengwyn/PacketProcessor"
    },
    {
      name: "Embedded Security",
      description: "Most software runs on machines you can see. Embedded systems run on machines that quietly power everything else.\
      This project is a bit more on the theoretical side inasmuch that I read the STM32 Security Documentation for an ARM CPU and it's on-board security. \
      Working with the STM32 microcontroller (an ARM-based CPU), I studied its on-board security architecture directly from the hardware documentation. Think of this like reading the blueprints of a vault — understanding not just how it locks, but why each mechanism exists and where the weak points could be.\
      I also learned about FreeRTOS much deeper using STM32Cube* and SEGGER utilities, it was a very fun and challenging project, I programmed using FreeRTOS; \
      learning some of its built-in APIs for message passing and task management. I used my reverse engineering experience for building optimal programs concerning its Nested Vectors. \
      Doing dynamic debugging with the Segger utilities felt really cool too!",
      technologies: ["STM32Cube", "SEGGER", "SystemView", "FreeRTOS", "Task Scheduling", "STM32F767Zl", "Debugging","J-Link"],
      status: "Research",
      link: null
    },
    {
      name: "Malware Analysis & Development",
      description: "What if a virus could rewrite itself every single time it ran, making it virtually invisible to the tools designed to catch it? Something I keep researching and developing on my own time, testing them in my homelab environment: \
      Polymorphic Malware; Keeps the same core behavior, but encrypts and reshuffles its outer shell each time it spreads. Same wolf, endlessly new coats. Antivirus signatures? Useless.\
      Metamorphic Malware Goes further — it rewrites its own logic and structure entirely. No two copies are functionally the same. No persistent signature exists to catch it. It evolves.\
      One of the reason I like this topic is that with ever evolving pattern matching tools in CyberSec (AI), these type of malware will see (and is) a massive rise, and being able to analyze them, not just run a mere tool to scan, will be key in the future.\
      The most dangerous code is the code that knows it's being watched — and changes accordingly.",
      status: "Research",
      technologies: ["GDB, x64DBG, Immunity Debugger", "Malware", "Reverse Engineering", "Entropy", "Dynamic Analysis", "Static Analysis", "ROP"],
      link: null
    },
    {
      name: "Reverse Engineering",
      description: "My Reverse Engineering laboratory course works. NOTE: I also did plenty outside University concerning Reverse Engineering. \
      Most notably, Hackathons, where I mostly did Binary Analysis, I've also used this skillset for cryptography. Phew! Apart from that, I've also hands-on experience doing binary exploitation, \
      ",
      technologies: ["Reverse Engineering", "Assembly", "Binary Analysis", "Binary Exploitation", "Hacking", "C", "C++", "Python", "Perl", "Scripting"],
      status: "Research",
      link: "https://github.com/fengwyn/Reverse-Engineering"
    },
    {
      name: "Other Projects",
      description: "Previously, I listed the ones that are most rigorous and relevant to Systems Programming and Cybersecurity. \
      I do have other projects which have been a quite neat learning experience, such as my Java based Rummy Card Game project. \
      That one was really fun due to its GUI interactions, and also Java is a fun language to use (imo). \
      I plan on picking up Java again sometimes in the future, the last time I used Java, was building a project, that using a Natural Language Processing Library, \
      I could more or less, 'social engineer' a user's possible password :3 \
                                                                            \
      My other big personal project, is a Radio-Frequency based Surveillance project, powered by my eIRC project's groundworks for the Node-Relay...\
      But more on that another time :)",
      status: "Completed",
      link: "https://github.com/fengwyn/"
    }
  ],

  // Achievements - milestones and accomplishments
  achievements: [
    {
      date: "2023-06",
      title: "Embedded Systems Security Research",
      description: "I conducted research on embedded systems security, specifically I analyzed RTOS-based task models, \
      identifying vulnerabilities in inter-task communications as potential attack surfaces; memory protection, and secure firmware design. \
      For this research I used Brian Amos' Hands-On RTOS with Microcontrollers, my previous knowledge of Computer Networks and Systems Security & Reverse Engineering courses.\
      I also used ST's Introduction to security for STM32 MCUs as a starting point for the embedded systems security research.",
      category: "Research"
    },
    {
      date: "2024-11",
      title: "GMiS Hackathon-Expert Texas 2024",
      description: "My first ever hackathon, I won 3rd place in the Expert category with my team. \
      I specialize in binary analysis, reverse engineering, cryptography and forensics. \
      We spent months preparing, I taught a workshop lab on how to get started Binary Analysis and Reverse Engineering :D" ,
      category: "Hackathon"
    },
    {
      date: "2025-04", 
      title: "NJIT Cybersecurity Competition 2025",
      description: "This one was much harder (imo), it was international with unlimited resources. \
      I specialized in the same categories, though we got in the top 10 nevertheless =). \
      One of my favorite challenges was a ciphertext which I identifed at first glance to have been encrypted with a linear feedback shift register.\
      This I knew because of my on-going research in FPGAs Digital Systems Design!",
      category: "Hackathon"
    },
    {
      date: "2025-05",
      title: "FPGA Network Security Project Completion",
      description: "Successfully implemented a packet processor and security verification on FPGA. \
      Implemented an Ethernet parser and checksum verifier on Artix-7 FPGA (8-byte datapath, BRAM FIFO). \
      For this research I used Xilinx Vivado and Vitis tools, and I used the Artix-7 FPGA board for the implementation. \
      The resources I used were Zainalabedin's Verilog Digital Systems Design, Getting Started with FPGAs by Russel Merrick, and the Xilinx FPGA documentation. \
      And for the Network aspects I took a course on Computer Networks which was taught by a Professor with an Network Engineering background. Hooray!",
      category: "Research"
    },
    {
      date: "2025-06",
      title: "Graduation B.S Computer Science, Minors Cybersecurity",
      description: "Graduated University, for my 'magnus-opum' I wanted to build something that would exercise most of my knowledge.\
      I built the aforementioned Network Relay, it's backbone allows for distributed nodes and seamless command module integration during runtime at no downtime. \
      One of the implementation for the command modules is to configure it as an Internet Relay Channel :). Which I did as a presentation for my Computer Networks course project.",
      category: "Celebration"
    }
  ],

  // About section content
  about: {
    title: "About Me",
    content: `Welcome, fellow Netizen. I'm navigating the digital frontier, exploring the intersection of 
    cybersecurity, networks, and embedded systems. This terminal serves as my log of progress 
    through cyberspace! As thou may have noticed, I like the 80's aesthetic, yes I read Neuromancer... yes I read Diaspora too.`,
    skills: ["Binary Analysis", "Binary Exploitation", "Cybersecurity", "Distributed Systems", "FPGA Development", "Embedded Systems", "Network Security", "Systems Programming", "TCP/IP", "Reverse Engineering", "C/C++", "Python", "ASM", "Java", "Penguins"]
  },

  // Contact information
  contact: {
    title: "Contact",
    email: "krzfrancesc@gmail.com",
    github: "github.com/fengwyn",
    other: []
  },

  // Ark of the Covenant - array of featured items (Title, Date, Description, Tags, Link)
  ark: [
    {
      title: "Ark",
      date: "",
      description: "A sacred vessel; here you may find messages, chosen works and my Theology study journey.",
      tags: [],
      link: null
    },
    {
      title: "Covenant Theology",
      date: "2026-02",
      description: "Studying Covenant Theology as of current date, I aim to convert fully to Christianity by the end of the year. :)",
      tags: ["Study", "Theology", "Christian", "Calvinism", "Presbyterian"],
      link: null
    }
  ]
};
