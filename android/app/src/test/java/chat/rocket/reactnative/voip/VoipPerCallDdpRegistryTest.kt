package chat.rocket.reactnative.voip

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class VoipPerCallDdpRegistryTest {

    private fun registry(): Pair<MutableList<String>, VoipPerCallDdpRegistry<String>> {
        val released = mutableListOf<String>()
        return released to VoipPerCallDdpRegistry { released.add(it) }
    }

    @Test
    fun `stopClient removes only the named callId`() {
        val (released, reg) = registry()
        reg.putClient("callA", "clientA")
        reg.putClient("callB", "clientB")
        reg.stopClient("callA")
        assertEquals(listOf("clientA"), released)
        assertEquals(setOf("callB"), reg.clientIds())
        assertEquals("clientB", reg.clientFor("callB"))
        assertNull(reg.clientFor("callA"))
    }

    @Test
    fun `stopAllClients disconnects every entry`() {
        val (released, reg) = registry()
        reg.putClient("callA", "clientA")
        reg.putClient("callB", "clientB")
        reg.stopAllClients()
        assertEquals(2, released.size)
        assertTrue(released.containsAll(listOf("clientA", "clientB")))
        assertEquals(0, reg.clientCount())
        assertTrue(reg.clientIds().isEmpty())
    }

    @Test
    fun `starting a second listener for another callId does not release the first`() {
        val (released, reg) = registry()
        reg.putClient("callA", "clientA")
        reg.putClient("callB", "clientB")
        assertTrue(released.isEmpty())
        assertEquals(setOf("callA", "callB"), reg.clientIds())
    }

    @Test
    fun `putClient for the same callId releases the previous client`() {
        val (released, reg) = registry()
        reg.putClient("callA", "first")
        reg.putClient("callA", "second")
        assertEquals(listOf("first"), released)
        assertEquals("second", reg.clientFor("callA"))
    }

    @Test
    fun `loggedIn state is per callId`() {
        val (_, reg) = registry()
        reg.putClient("callA", "a")
        reg.putClient("callB", "b")
        assertFalse(reg.isLoggedIn("callA"))
        reg.markLoggedIn("callA")
        assertTrue(reg.isLoggedIn("callA"))
        assertFalse(reg.isLoggedIn("callB"))
    }

    @Test
    fun `stopClient clears loggedIn for that callId`() {
        val (_, reg) = registry()
        reg.putClient("callA", "a")
        reg.markLoggedIn("callA")
        reg.stopClient("callA")
        assertFalse(reg.isLoggedIn("callA"))
    }
}
