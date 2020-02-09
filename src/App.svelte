<div class="h-screen grid grid-cols-3 gap-5 mx-5" style="grid-template-rows: max-content 1fr">
  <div class="col-span-2 rounded shadow-lg bg-white px-6 py-4 my-5">
    <div class="text-gray-400 flex items-center justify-center">
      <span class="mr-auto">
        <TrashIcon class="stroke-1 opacity-0" size="2x"/>
      </span>
      <span title="Turn proxy server on/off" class="cursor-pointer mr-5" on:click={toggleProxyServer}>
          <ServerIcon class="stroke-1 {proxyServer ? 'text-teal-400' : 'hover:text-teal-400'}" size="2x"/>
        </span>
      <span title="Turn packet listening on/off" class="cursor-pointer mr-5" on:click={() => listening = !listening}>
        <PlayIcon class="stroke-1 {listening ? 'text-teal-400' : 'hover:text-teal-400'}" size="2x"/>
      </span>
      <span title="Clear the packets window" class="cursor-pointer ml-auto" on:click={() => packets = []}>
        <TrashIcon class="stroke-1 hover:text-teal-400" size="2x"/>
      </span>
    </div>
  </div>
  <div class="rounded shadow-lg bg-white px-6 py-4 my-5 relative">
    <input bind:value={searchQuery} type="text" placeholder="Search packets" class="bg-white border bg-gray-200 focus:bg-white focus:border-gray-300 focus:outline-none rounded-lg py-2 pr-4 pl-10 block w-full appearance-none leading-normal placeholder-gray-600">
    <SearchIcon class="absolute text-gray-600 pointer-events-none top-0 left-0 mt-6 ml-8" size="1.5x"/>
  </div>
  <div class="col-span-2 relative my-5 rounded shadow-lg overflow-y-auto max-h-full" id="packets">
    {#each packets as packet, idx}
      {#if (searchQuery !== '' && packet.meta.name.includes(searchQuery)) || (searchQuery === '' && filters[packet.meta.name] !== true)}
        <div class="py-4 px-6 cursor-pointer" on:click={() => togglePacket(idx)} transition:slide="{{duration: 250, easing: quintOut}}">
          <div class="flex">
            <pre>{packet.meta.name}</pre>
            <div class="ml-auto">
              <div class="text-gray-400 hover:text-teal-400 cursor-pointer" on:click|stopPropagation={() => filterPacket(packet.meta.name)}>
                <FilterIcon size="1.2x"/>
              </div>
            </div>
          </div>
        </div>
        {#if packet.open}
          <div class="pb-4 px-6" transition:slide="{{duration: 250, easing: quintOut}}">
            <pre class="text-xs">{@html formatJSON({ data: packet.data, meta: packet.meta })}</pre>
          </div>
        {/if}
        <div class="border-b border-gray-300"></div>
      {/if}
    {/each}
  </div>
  <div class="p-5 row-span-2">
    <div class="text-xl pb-2">
      Filtered packets
      {#if Object.keys(filters).length}
        <span on:click={() => filters = Object.create(null)} title="Clear all filters" class="float-right cursor-pointer">
          <TrashIcon class="stroke-1 text-gray-400 hover:text-teal-400" size="1.5x"/>
        </span>
      {/if}
    </div>
    {#each Object.keys(filters) as packet}
      {#if filters[packet]}
        <div class="text-xs flex pb-3 pt-4 border-b border-gray-400" transition:slide="{{duration: 250, easing: quintOut}}">
          <pre>{packet}</pre>
          <div class="ml-auto">
            <div class="text-red-400 cursor-pointer" on:click={filterPacket(packet, false)}>
              <XIcon size="1.2x"/>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<script>
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { FilterIcon, XIcon, PlayIcon, SearchIcon, TrashIcon, ServerIcon } from 'svelte-feather-icons'
  import { onMount } from 'svelte';
  import formatJSON from 'json-format-highlight'

  let searchQuery = ''
  let listening = true

  const packet1 = {
    data: {
      meh: 3,
      nah: {
        pff: false,
        waff: [ 1, 2, 3, 4, 5 ]
      }
    },
    meta: {
      name: 'dummy_packet_1'
    }
  }
  const packet2 = {
    data: {},
    meta: {
      name: 'dummy_packet_2'
    }
  }

  let filters = {
    entity_head_rotation: true,
    entity_teleport: true,
    entity_status: true,
    entity_metadata: true,
    rel_entity_move: true,

    update_time: true,

    look: true,
    position: true,
    position_look: true,
    arm_animation: true,

    block_change: true
  }
  let packets = []

  let proxyServer = true
  function toggleProxyServer () {
    proxyServer = !proxyServer

    if (proxyServer) {
      // TODO: Turn on
    } else {
      // TODO: Turn off
    }
  }

  function getPacket () {
    return (Math.random() * 1000 ^ 0) % 2 ? packet1 : packet2
  }

  function filterPacket (name, state = true) {
    filters[name] = state
    filters = filters
  }

  let togglePacket
  onMount(() => {
    let lastOpen
    let queueScrollDown = true
    let ignoreNextScrollEvent = false

    togglePacket = function (idx) {
      queueScrollDown = false
      packets[idx].open = !packets[idx].open

      if (packets[idx].open && lastOpen != null) {
        packets[lastOpen].open = false
        lastOpen = idx
      } else {
        lastOpen = null
      }
    }

    const packetsElement = document.getElementById('packets')

    packetsElement.addEventListener('scroll', evt => {
      if (ignoreNextScrollEvent) {
        ignoreNextScrollEvent = false
        return
      }

      queueScrollDown = packetsElement.scrollTop === packetsElement.scrollHeight - packetsElement.offsetHeight
    })

    function addPacket (packet) {
      packets = packets.concat(packet)
    }

    function autoScrollDown () {
      if (queueScrollDown && packetsElement.scrollTop !== packetsElement.scrollHeight - packetsElement.offsetHeight) {
        ignoreNextScrollEvent = true
        packetsElement.scrollTop = packetsElement.scrollHeight
      }

      requestAnimationFrame(autoScrollDown)
    }

    autoScrollDown()

    setInterval(() => {
      const packet = getPacket()
      addPacket({ ...packet, open: false })
    }, 1000)
  })
</script>
